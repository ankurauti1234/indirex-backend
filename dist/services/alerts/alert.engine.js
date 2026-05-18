"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateSettings = getOrCreateSettings;
exports.runInactivityCheck = runInactivityCheck;
exports.sendInactivityReport = sendInactivityReport;
exports.startInactivityScheduler = startInactivityScheduler;
exports.stopInactivityScheduler = stopInactivityScheduler;
// src/services/alerts/alert.engine.ts
const connection_1 = require("../../database/connection");
const InactivityAlert_1 = require("../../database/entities/InactivityAlert");
const AlertSettings_1 = require("../../database/entities/AlertSettings");
const AlertEmailRecipient_1 = require("../../database/entities/AlertEmailRecipient");
const alert_email_1 = require("./alert.email");
/**
 * Ensure a single AlertSettings row exists (singleton pattern).
 */
async function getOrCreateSettings() {
    const repo = connection_1.AppDataSource.getRepository(AlertSettings_1.AlertSettings);
    let settings = await repo.findOne({ where: { id: 1 } });
    if (!settings) {
        settings = repo.create({
            id: 1,
            inactivityThresholdHours: 48,
            emailFrequencyHours: 48,
        });
        await repo.save(settings);
    }
    return settings;
}
/**
 * The core inactivity check — fully optimised with bulk SQL operations.
 *
 * Strategy:
 *   1) One CTE query finds all inactive meters + their all-time last event
 *      (same window logic as the connectivity report)
 *   2) One bulk INSERT ... ON CONFLICT upserts all inactive rows at once
 *   3) One bulk UPDATE resolves all meters that came back online
 *   4) One UPDATE sets the lastCheckAt timestamp
 *
 * Zero N+1 queries. Total DB round trips: 4 regardless of meter count.
 */
async function runInactivityCheck() {
    const now = new Date();
    // --- Step 1: Calculate today's Yerevan-window timestamps ---
    // Yerevan UTC+4: day window = previous day 22:00 UTC -> current day 21:59:59 UTC
    const todayStr = new Date().toISOString().split("T")[0];
    const baseDate = new Date(`${todayStr}T00:00:00Z`);
    const startDate = new Date(baseDate);
    startDate.setUTCDate(startDate.getUTCDate() - 1);
    startDate.setUTCHours(22, 0, 0, 0);
    const endDate = new Date(baseDate);
    endDate.setUTCHours(21, 59, 59, 999);
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    // --- Step 2: Single query — find all inactive meters + all-time last event ---
    // Uses a lateral join for last_event_unix so it's one pass, not N correlated subqueries.
    // Only assigned meters are checked (same as connectivity report).
    const inactiveRows = await connection_1.AppDataSource.query(`
    WITH latest_assignments AS (
      SELECT DISTINCT ON (ma.meter_id)
        ma.meter_id,
        ma.household_id
      FROM meter_assignments ma
      INNER JOIN meters m ON ma.meter_id = m.id
      WHERE m.meter_id BETWEEN 'IM000101' AND 'IM000600'
      ORDER BY ma.meter_id, ma.assigned_at DESC
    ),
    meter_base AS (
      SELECT
        m.meter_id AS device_id,
        h.hhid
      FROM latest_assignments la
      INNER JOIN meters m ON la.meter_id = m.id
      INNER JOIN households h ON la.household_id = h.id
    ),
    active_in_window AS (
      SELECT DISTINCT e.device_id
      FROM events e
      WHERE e.timestamp >= $1
        AND e.timestamp <= $2
        AND e.device_id BETWEEN 'IM000101' AND 'IM000600'
    ),
    inactive_meters AS (
      SELECT mb.device_id, mb.hhid
      FROM meter_base mb
      WHERE mb.device_id NOT IN (SELECT device_id FROM active_in_window)
    ),
    last_events AS (
      SELECT
        im.device_id,
        MAX(e.timestamp) AS last_event_unix
      FROM inactive_meters im
      LEFT JOIN events e ON e.device_id = im.device_id AND e.timestamp < $1
      GROUP BY im.device_id
    )
    SELECT
      im.device_id,
      im.hhid,
      le.last_event_unix
    FROM inactive_meters im
    LEFT JOIN last_events le ON le.device_id = im.device_id
    ORDER BY im.device_id
    `, [startTimestamp, endTimestamp]);
    if (inactiveRows.length === 0) {
        // All meters are active — resolve everything in one shot
        await connection_1.AppDataSource.query(`UPDATE inactivity_alerts SET "isActive" = false, "updatedAt" = NOW() WHERE "isActive" = true`);
        await connection_1.AppDataSource.query(`UPDATE alert_settings SET "lastCheckAt" = NOW(), "updatedAt" = NOW() WHERE id = 1`);
        console.log(`[InactivityCheck] All meters active. All alerts resolved.`);
        return { newInactive: 0, resolved: 0, totalInactive: 0 };
    }
    // --- Step 3: Bulk upsert all inactive meters in ONE query ---
    // INSERT ... ON CONFLICT (device_id) DO UPDATE — single round trip for all rows
    const nowIso = now.toISOString();
    const values = inactiveRows
        .map((row) => {
        const lastEventAt = row.last_event_unix
            ? new Date(Number(row.last_event_unix) * 1000).toISOString()
            : null;
        const lastEventSql = lastEventAt ? `'${lastEventAt}'` : "NULL";
        const hhidSql = row.hhid ? `'${row.hhid.replace(/'/g, "''")}'` : "NULL";
        return `('${row.device_id}', ${hhidSql}, ${lastEventSql}, '${nowIso}', true, '${nowIso}', '${nowIso}')`;
    })
        .join(",\n");
    const upsertResult = await connection_1.AppDataSource.query(`
    INSERT INTO inactivity_alerts
      (device_id, hhid, "lastEventAt", "detectedAt", "isActive", "createdAt", "updatedAt")
    VALUES ${values}
    ON CONFLICT (device_id) DO UPDATE SET
      hhid            = EXCLUDED.hhid,
      "lastEventAt"   = EXCLUDED."lastEventAt",
      "isActive"      = true,
      "updatedAt"     = NOW()
    RETURNING (xmax = 0) AS inserted
    `);
    const newInactive = upsertResult.filter((r) => r.inserted).length;
    // --- Step 4: Bulk resolve meters that came back online — one UPDATE ---
    const inactiveDeviceIds = inactiveRows.map((r) => `'${r.device_id}'`).join(",");
    const resolveResult = await connection_1.AppDataSource.query(`
    UPDATE inactivity_alerts
    SET "isActive" = false, "updatedAt" = NOW()
    WHERE "isActive" = true
      AND device_id NOT IN (${inactiveDeviceIds})
    RETURNING device_id
    `);
    const resolved = resolveResult.length;
    // --- Step 5: Update lastCheckAt in one query ---
    await connection_1.AppDataSource.query(`UPDATE alert_settings SET "lastCheckAt" = NOW(), "updatedAt" = NOW() WHERE id = 1`);
    const totalInactive = inactiveRows.length;
    console.log(`[InactivityCheck] Done. New: ${newInactive}, Resolved: ${resolved}, Total inactive: ${totalInactive}`);
    return { newInactive, resolved, totalInactive };
}
/**
 * Send the inactivity email report to all configured recipients.
 */
async function sendInactivityReport() {
    const alertRepo = connection_1.AppDataSource.getRepository(InactivityAlert_1.InactivityAlert);
    const recipientRepo = connection_1.AppDataSource.getRepository(AlertEmailRecipient_1.AlertEmailRecipient);
    const recipients = await recipientRepo.find();
    if (recipients.length === 0) {
        console.log("[InactivityReport] No recipients configured — skipping email.");
        return { sent: false, recipientCount: 0 };
    }
    const alerts = await alertRepo.find({
        where: { isActive: true },
        order: { device_id: "ASC" },
    });
    if (alerts.length === 0) {
        console.log("[InactivityReport] No inactive meters — skipping email.");
        return { sent: false, recipientCount: 0 };
    }
    const toAddresses = recipients.map((r) => r.email);
    await (0, alert_email_1.sendInactivityAlertEmail)(toAddresses, alerts);
    await connection_1.AppDataSource.query(`UPDATE alert_settings SET "lastEmailSentAt" = NOW(), "updatedAt" = NOW() WHERE id = 1`);
    console.log(`[InactivityReport] Sent to ${toAddresses.length} recipients with ${alerts.length} inactive meters.`);
    return { sent: true, recipientCount: toAddresses.length };
}
/**
 * Background scheduler — runs every 6 hours, also on startup.
 */
let schedulerInterval = null;
function startInactivityScheduler() {
    console.log("[InactivityScheduler] Starting...");
    runInactivityCheck()
        .then(() => checkAndSendEmail())
        .catch((err) => console.error("[InactivityScheduler] Initial run failed:", err));
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    schedulerInterval = setInterval(async () => {
        try {
            await runInactivityCheck();
            await checkAndSendEmail();
        }
        catch (err) {
            console.error("[InactivityScheduler] Scheduled run failed:", err);
        }
    }, SIX_HOURS);
    console.log("[InactivityScheduler] Scheduled to run every 6 hours.");
}
function stopInactivityScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log("[InactivityScheduler] Stopped.");
    }
}
async function checkAndSendEmail() {
    const settings = await getOrCreateSettings();
    const frequencyMs = settings.emailFrequencyHours * 60 * 60 * 1000;
    if (settings.lastEmailSentAt) {
        const elapsed = Date.now() - new Date(settings.lastEmailSentAt).getTime();
        if (elapsed < frequencyMs) {
            console.log(`[InactivityScheduler] Email not due yet (${Math.round((frequencyMs - elapsed) / 3600000)}h remaining).`);
            return;
        }
    }
    await sendInactivityReport();
}
//# sourceMappingURL=alert.engine.js.map