// lambda.js
import { Client } from 'pg';
import AWS from 'aws-sdk';

const ses = new AWS.SES({ region: process.env.REGION });
const client = new Client({ connectionString: process.env.POSTGRES_URI });
let clientConnected = false;

// Utility: Generate 4-digit OTP
function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Connect DB once per Lambda container lifecycle
async function connectDB() {
  if (!clientConnected) {
    await client.connect();
    clientConnected = true;
    console.log('✅ Connected to PostgreSQL');
  }
}

export const handler = async (event) => {
  console.log('Incoming Event:', JSON.stringify(event));

  await connectDB();

  const { httpMethod, path, body, queryStringParameters = {} } = event;
  const parsedBody = body ? JSON.parse(body) : {};

  try {
    // -------------------------------------------------
    // 1️⃣ POST /initiate-assignment
    // -------------------------------------------------
    if (httpMethod === 'POST' && path === '/initiate-assignment') {
      const { meter_id: meterid, hhid } = parsedBody;
      if (!meterid || !hhid) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'Missing meter_id or hhid' }),
        };
      }

      const normalizedHhid = /^\d{4}$/.test(hhid) ? `HH${hhid}` : hhid;

      // Household check
      const hhRes = await client.query('SELECT id FROM households WHERE hhid = $1', [normalizedHhid]);
      if (hhRes.rows.length === 0)
        return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Household not found' }) };
      const householdId = hhRes.rows[0].id;

      // Meter check
      const meterRes = await client.query('SELECT id, assigned_household_id FROM meters WHERE meter_id = $1', [meterid]);
      if (meterRes.rows.length === 0)
        return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Meter not found' }) };

      const meter = meterRes.rows[0];
      if (meter.assigned_household_id)
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Meter already assigned' }) };

      // Generate OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await client.query(
        'INSERT INTO meter_otps (meter_id, otp_code, expires_at, consumed) VALUES ($1, $2, $3, $4)',
        [meter.id, otp, expiresAt, false]
      );

      // Fetch contact email
      const contactRes = await client.query(
        'SELECT contact_email FROM preregistered_contacts WHERE household_id = $1 AND is_active = true LIMIT 1',
        [householdId]
      );

      if (contactRes.rows.length === 0)
        return { statusCode: 500, body: JSON.stringify({ success: false, message: 'No active contact email' }) };

      const email = contactRes.rows[0].contact_email;

      // Send OTP via SES
      await ses
        .sendEmail({
          Source: process.env.SES_SOURCE_EMAIL,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: 'Meter Assignment OTP' },
            Body: { Text: { Data: `OTP for ${meterid} → ${normalizedHhid}: ${otp} (valid 10 min)` } },
          },
        })
        .promise();

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'OTP sent', meter_id: meterid, hhid: normalizedHhid }),
      };
    }

    // -------------------------------------------------
    // 2️⃣ POST /verify-otp
    // -------------------------------------------------
    if (httpMethod === 'POST' && path === '/verify-otp') {
      const { meter_id: meterid, hhid, otp } = parsedBody;
      if (!meterid || !hhid || !otp) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'Missing meter_id, hhid, or otp' }),
        };
      }

      const normalizedHhid = /^\d{4}$/.test(hhid) ? `HH${hhid}` : hhid;

      // Meter check
      const meterRes = await client.query('SELECT id, assigned_household_id FROM meters WHERE meter_id = $1', [meterid]);
      if (meterRes.rows.length === 0)
        return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Meter not found' }) };

      const meter = meterRes.rows[0];
      if (meter.assigned_household_id)
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Meter already assigned' }) };

      // Verify OTP
      const otpRes = await client.query(
        'SELECT id, expires_at FROM meter_otps WHERE meter_id = $1 AND otp_code = $2 AND consumed = false ORDER BY created_at DESC LIMIT 1',
        [meter.id, otp]
      );

      if (otpRes.rows.length === 0)
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid/expired OTP' }) };

      const otpRow = otpRes.rows[0];
      if (new Date(otpRow.expires_at) < new Date())
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'OTP expired' }) };

      // Validate household
      const hhRes = await client.query('SELECT id FROM households WHERE hhid = $1', [normalizedHhid]);
      if (hhRes.rows.length === 0)
        return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Household not found' }) };
      const householdId = hhRes.rows[0].id;

      // Assign meter
      await client.query('BEGIN');
      await client.query('UPDATE meter_otps SET consumed = true WHERE id = $1', [otpRow.id]);
      await client.query('UPDATE meters SET assigned_household_id = $1, is_assigned = true WHERE id = $2', [
        householdId,
        meter.id,
      ]);
      await client.query(
        'INSERT INTO meter_assignments (meter_id, household_id, assigned_by) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [meter.id, householdId, 'api-verify-otp']
      );
      await client.query('COMMIT');

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Assigned successfully',
          meter_id: meterid,
          hhid: normalizedHhid,
        }),
      };
    }

    // -------------------------------------------------
    // 3️⃣ GET /members?meterid=..&hhid=..
    // -------------------------------------------------
    if (httpMethod === 'GET' && path === '/members') {
      const { meterid, hhid: rawHhid } = queryStringParameters;
      if (!meterid || !rawHhid) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'meterid and hhid required' }),
        };
      }

      const hhid = /^\d{4}$/.test(rawHhid) ? `HH${rawHhid}` : rawHhid;

      // Verify meter → household
      const res = await client.query(
        `
        SELECT h.id AS household_id
        FROM meters m
        JOIN households h ON m.assigned_household_id = h.id
        WHERE m.meter_id = $1 AND h.hhid = $2
      `,
        [meterid, hhid]
      );

      if (res.rows.length === 0)
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Meter not assigned to household' }),
        };

      const householdId = res.rows[0].household_id;

      // Fetch members (using new schema)
      const membersRes = await client.query(
        'SELECT member_code, dob, gender, created_at FROM members WHERE household_id = $1 ORDER BY member_code ASC',
        [householdId]
      );

      const members = membersRes.rows.map((m) => ({
        member_code: m.member_code,
        dob: m.dob.toISOString().split('T')[0], // YYYY-MM-DD
        gender: m.gender,
        created_at: m.created_at.toISOString(),
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          meter_id: meterid,
          hhid,
          members,
        }),
      };
    }

    // -------------------------------------------------
    // Default 404
    // -------------------------------------------------
    return {
      statusCode: 404,
      body: JSON.stringify({ success: false, message: 'Not found' }),
    };
  } catch (err) {
    console.error('❌ Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
};
