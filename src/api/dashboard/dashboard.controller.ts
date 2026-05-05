// src/api/dashboard/dashboard.controller.ts
import { Request, Response } from "express";
import { AppDataSource } from "../../database/connection";
import { Meter } from "../../database/entities/Meter";
import { Event } from "../../database/entities/Event";
import { EventMapping } from "../../database/entities/EventMapping";
import { sendSuccess, sendError } from "../../utils/response";

// Reusable IM range filter (IM000101 – IM000600)
const IM_RANGE_CONDITION = `
  meter.meterId LIKE 'IM%'
  AND CAST(SUBSTRING(meter.meterId FROM 3) AS INTEGER) BETWEEN :minNum AND :maxNum
`;
const IM_RANGE_PARAMS = { minNum: 101, maxNum: 600 };

// GET /api/v1/dashboard/stats
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const meterRepo = AppDataSource.getRepository(Meter);
    const eventRepo = AppDataSource.getRepository(Event);
    const eventMappingRepo = AppDataSource.getRepository(EventMapping);

    // Yerevan window (UTC+4): previous day 22:00 UTC -> current day 21:59:59 UTC
    // Same window used by connectivity report and alert engine so numbers always match
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const windowStart = new Date(today);
    windowStart.setUTCDate(windowStart.getUTCDate() - 1);
    windowStart.setUTCHours(22, 0, 0, 0);

    const windowEnd = new Date(today);
    windowEnd.setUTCHours(21, 59, 59, 999);

    const startTimestamp = Math.floor(windowStart.getTime() / 1000);
    const endTimestamp = Math.floor(windowEnd.getTime() / 1000);

    const [totalInstalled, totalMeters, totalEventTypes, activeDevicesToday] =
      await Promise.all([
        // Installed meters in range (isAssigned = true)
        meterRepo
          .createQueryBuilder("meter")
          .where("meter.isAssigned = :isAssigned", { isAssigned: true })
          .andWhere(IM_RANGE_CONDITION, IM_RANGE_PARAMS)
          .getCount(),

        // Total meters in range
        meterRepo
          .createQueryBuilder("meter")
          .where(IM_RANGE_CONDITION, IM_RANGE_PARAMS)
          .getCount(),

        // Total distinct event types in event_mapping
        eventMappingRepo.count(),

        // Active devices: exact same CTE logic as connectivity report
        // Only counts assigned meters that sent events in the Yerevan window
        AppDataSource.query(`
          WITH latest_assignments AS (
            SELECT DISTINCT ON (ma.meter_id) ma.meter_id, ma.household_id
            FROM meter_assignments ma
            INNER JOIN meters m ON ma.meter_id = m.id
            WHERE m.meter_id BETWEEN 'IM000101' AND 'IM000600'
            ORDER BY ma.meter_id, ma.assigned_at DESC
          )
          SELECT COUNT(*) AS count
          FROM latest_assignments la
          INNER JOIN meters m ON la.meter_id = m.id
          INNER JOIN households h ON la.household_id = h.id
          WHERE EXISTS (
            SELECT 1 FROM events e
            WHERE e.device_id = m.meter_id
              AND e.timestamp >= $1
              AND e.timestamp <= $2
          )
        `, [startTimestamp, endTimestamp]).then((r: any[]) => Number(r[0]?.count ?? 0)),
      ]);

    sendSuccess(
      res,
      {
        totalInstalled,
        totalMeters,
        totalUninstalled: totalMeters - totalInstalled,
        totalEventTypes,
        activeDevicesToday,
      },
      "Dashboard stats fetched"
    );
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};