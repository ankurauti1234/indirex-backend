"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSilentReports = exports.getHealthReports = void 0;
const connection_1 = require("../../database/connection");
const DeviceHealthReportCSV_1 = require("../../database/entities/DeviceHealthReportCSV");
const SilentDeviceReportCSV_1 = require("../../database/entities/SilentDeviceReportCSV");
const response_1 = require("../../utils/response");
async function getReports(entity, req, res) {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
        const search = (req.query.search || "").trim();
        const offset = (page - 1) * limit;
        const qb = connection_1.AppDataSource.getRepository(entity)
            .createQueryBuilder("r")
            .orderBy("r.createdAt", "DESC");
        if (search) {
            qb.where("r.date_label ILIKE :search OR r.s3_url ILIKE :search", {
                search: `%${search}%`,
            });
        }
        const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();
        (0, response_1.sendSuccess)(res, {
            data: rows,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
}
const getHealthReports = (req, res) => getReports(DeviceHealthReportCSV_1.DeviceHealthReportCSV, req, res);
exports.getHealthReports = getHealthReports;
const getSilentReports = (req, res) => getReports(SilentDeviceReportCSV_1.SilentDeviceReportCSV, req, res);
exports.getSilentReports = getSilentReports;
//# sourceMappingURL=device-reports.controller.js.map