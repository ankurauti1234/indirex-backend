"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const connection_1 = require("../../database/connection");
const Meter_1 = require("../../database/entities/Meter");
const Event_1 = require("../../database/entities/Event");
const EventMapping_1 = require("../../database/entities/EventMapping");
const response_1 = require("../../utils/response");
// Reusable IM range filter (IM000101 – IM000600)
const IM_RANGE_CONDITION = `
  meter.meterId LIKE 'IM%'
  AND CAST(SUBSTRING(meter.meterId FROM 3) AS INTEGER) BETWEEN :minNum AND :maxNum
`;
const IM_RANGE_PARAMS = { minNum: 101, maxNum: 600 };
// GET /api/v1/dashboard/stats
const getDashboardStats = async (_req, res) => {
    try {
        const meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
        const eventRepo = connection_1.AppDataSource.getRepository(Event_1.Event);
        const eventMappingRepo = connection_1.AppDataSource.getRepository(EventMapping_1.EventMapping);
        // Start of today (UTC)
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const [totalInstalled, totalMeters, totalEventTypes, activeDevicesToday] = await Promise.all([
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
                .andWhere("CAST(SUBSTRING(event.device_id FROM 3) AS INTEGER) BETWEEN :minNum AND :maxNum", { minNum: 101, maxNum: 600 })
                .getRawOne()
                .then((r) => Number(r?.count ?? 0)),
        ]);
        (0, response_1.sendSuccess)(res, {
            totalInstalled,
            totalMeters,
            totalUninstalled: totalMeters - totalInstalled,
            totalEventTypes,
            activeDevicesToday,
        }, "Dashboard stats fetched");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboard.controller.js.map