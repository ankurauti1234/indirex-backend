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

    // Start of today (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

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

        // Active devices today: distinct device_ids in IM000101-IM000600 range
        // that have at least one event with createdAt >= today
        eventRepo
          .createQueryBuilder("event")
          .select("COUNT(DISTINCT event.device_id)", "count")
          .where("event.createdAt >= :todayStart", { todayStart })
          .andWhere("event.device_id LIKE 'IM%'")
          .andWhere(
            "CAST(SUBSTRING(event.device_id FROM 3) AS INTEGER) BETWEEN :minNum AND :maxNum",
            { minNum: 101, maxNum: 600 }
          )
          .getRawOne()
          .then((r) => Number(r?.count ?? 0)),
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