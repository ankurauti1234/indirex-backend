// src/services/alerts/alert.engine.ts
import { AppDataSource } from "../../database/connection";
import { InactivityAlert } from "../../database/entities/InactivityAlert";
import { AlertSettings } from "../../database/entities/AlertSettings";
import { AlertEmailRecipient } from "../../database/entities/AlertEmailRecipient";
import { sendInactivityAlertEmail } from "./alert.email";

/**
 * Ensure a single AlertSettings row exists (singleton pattern).
 * Returns the current settings.
 */
export async function getOrCreateSettings(): Promise<AlertSettings> {
  const repo = AppDataSource.getRepository(AlertSettings);
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
 * The core inactivity check.
 *
 * Strategy: Reuses the exact same SQL as the connectivity report.
 * A meter is "inactive" if it has status = 'No' for YESTERDAY's window
 * (Yerevan time UTC+4: previous day 22:00 UTC to current day 21:59:59 UTC).
 *
 * This is consistent with what the connectivity report shows,
 * so the alerts page and connectivity report will always agree.
 */
export async function runInactivityCheck(): Promise<{
  newInactive: number;
  resolved: number;
  totalInactive: number;
}> {
  const alertRepo = AppDataSource.getRepository(InactivityAlert);
  const now = new Date();

  // --- Step 1: Calculate yesterday's Yerevan-window timestamps ---
  // Same logic as getGeneralReport in event.service.ts
  // Window: previous day 22:00:00 UTC to current day 21:59:59 UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - 1);
  startDate.setUTCHours(22, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setUTCHours(21, 59, 59, 999);

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  // --- Step 2: Run the connectivity report query, filter for status = 'No' ---
  // Reuses exact same CTE structure as event.service.ts getGeneralReport()
  const query = `
    WITH latest_assignments AS (
      SELECT DISTINCT ON (ma.meter_id)
        ma.meter_id,
        ma.household_id
      FROM meter_assignments ma
      INNER JOIN meters m ON ma.meter_id = m.id
      WHERE m.meter_id BETWEEN 'IM000101' AND 'IM000600'
      ORDER BY ma.meter_id, ma.assigned_at DESC
    ),
    meter_activity AS (
      SELECT
        m.meter_id AS device_id,
        h.hhid,
        CASE WHEN COUNT(e.id) > 0 THEN 'Yes' ELSE 'No' END AS status
      FROM latest_assignments la
      INNER JOIN meters m ON la.meter_id = m.id
      INNER JOIN households h ON la.household_id = h.id
      LEFT JOIN events e ON e.device_id = m.meter_id
        AND e.timestamp >= $1
        AND e.timestamp <= $2
      GROUP BY m.meter_id, h.hhid
    ),
    all_time_last AS (
      SELECT
        m.meter_id AS device_id,
        MAX(e.timestamp) AS last_event_unix
      FROM latest_assignments la
      INNER JOIN meters m ON la.meter_id = m.id
      LEFT JOIN events e ON e.device_id = m.meter_id
      GROUP BY m.meter_id
    )
    SELECT ma.device_id, ma.hhid, al.last_event_unix
    FROM meter_activity ma
    LEFT JOIN all_time_last al ON al.device_id = ma.device_id
    WHERE ma.status = 'No'
    ORDER BY ma.device_id
  `;

  const inactiveRows: { device_id: string; hhid: string; last_event_unix: string | null }[] =
    await AppDataSource.query(query, [startTimestamp, endTimestamp]);

  const inactiveDeviceIds = new Set(inactiveRows.map((r) => r.device_id));

  // --- Step 3: Upsert inactive meters into inactivity_alerts ---
  let newInactive = 0;
  for (const row of inactiveRows) {
    const lastEventAt = row.last_event_unix
      ? new Date(Number(row.last_event_unix) * 1000)
      : null;

    const existing = await alertRepo.findOne({ where: { device_id: row.device_id } });

    if (existing) {
      existing.lastEventAt = lastEventAt;
      existing.hhid = row.hhid;
      existing.isActive = true;
      await alertRepo.save(existing);
    } else {
      const alert = alertRepo.create({
        device_id: row.device_id,
        hhid: row.hhid,
        lastEventAt,
        detectedAt: now,
        isActive: true,
      });
      await alertRepo.save(alert);
      newInactive++;
    }
  }

  // --- Step 4: Auto-resolve meters that sent events yesterday (came back online) ---
  const currentlyActive = await alertRepo.find({ where: { isActive: true } });

  let resolved = 0;
  for (const alert of currentlyActive) {
    if (!inactiveDeviceIds.has(alert.device_id)) {
      alert.isActive = false;
      await alertRepo.save(alert);
      resolved++;
    }
  }

  // --- Step 5: Update last check timestamp ---
  const settingsRepo = AppDataSource.getRepository(AlertSettings);
  await settingsRepo.update(1, { lastCheckAt: now });

  const totalInactive = await alertRepo.count({ where: { isActive: true } });

  console.log(
    `[InactivityCheck] Done. New: ${newInactive}, Resolved: ${resolved}, Total inactive: ${totalInactive}`
  );

  return { newInactive, resolved, totalInactive };
}

/**
 * Send the inactivity email report to all configured recipients.
 * Generates an Excel attachment on-the-fly from inactivity_alerts.
 */
export async function sendInactivityReport(): Promise<{
  sent: boolean;
  recipientCount: number;
}> {
  const alertRepo = AppDataSource.getRepository(InactivityAlert);
  const recipientRepo = AppDataSource.getRepository(AlertEmailRecipient);

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

  const toAddresses = recipients.map((r: { email: any; }) => r.email);

  await sendInactivityAlertEmail(toAddresses, alerts);

  const settingsRepo = AppDataSource.getRepository(AlertSettings);
  await settingsRepo.update(1, { lastEmailSentAt: new Date() });

  console.log(
    `[InactivityReport] Sent to ${toAddresses.length} recipients with ${alerts.length} inactive meters.`
  );

  return { sent: true, recipientCount: toAddresses.length };
}

/**
 * Background scheduler. Runs the inactivity check every 6 hours
 * and the email report based on the configured frequency.
 */
let schedulerInterval: NodeJS.Timeout | null = null;

export function startInactivityScheduler(): void {
  console.log("[InactivityScheduler] Starting...");

  runInactivityCheck()
    .then(() => checkAndSendEmail())
    .catch((err) =>
      console.error("[InactivityScheduler] Initial run failed:", err)
    );

  const SIX_HOURS = 6 * 60 * 60 * 1000;
  schedulerInterval = setInterval(async () => {
    try {
      await runInactivityCheck();
      await checkAndSendEmail();
    } catch (err) {
      console.error("[InactivityScheduler] Scheduled run failed:", err);
    }
  }, SIX_HOURS);

  console.log("[InactivityScheduler] Scheduled to run every 6 hours.");
}

export function stopInactivityScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[InactivityScheduler] Stopped.");
  }
}

async function checkAndSendEmail(): Promise<void> {
  const settings = await getOrCreateSettings();
  const frequencyMs = settings.emailFrequencyHours * 60 * 60 * 1000;

  if (settings.lastEmailSentAt) {
    const elapsed = Date.now() - new Date(settings.lastEmailSentAt).getTime();
    if (elapsed < frequencyMs) {
      console.log(
        `[InactivityScheduler] Email not due yet (${Math.round(
          (frequencyMs - elapsed) / 3600000
        )}h remaining).`
      );
      return;
    }
  }

  await sendInactivityReport();
}