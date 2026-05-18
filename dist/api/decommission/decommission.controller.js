"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHouseholdMeterHistory = exports.getDecommissionLogs = exports.decommissionMeter = exports.getAssignedMeters = void 0;
const decommission_service_1 = require("../../services/decommission/decommission.service");
const response_1 = require("../../utils/response");
const service = new decommission_service_1.DecommissionService();
const getAssignedMeters = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const result = await service.getAssignedMeters({
            page: Number(page),
            limit: Number(limit),
            search: search,
        });
        (0, response_1.sendSuccess)(res, result, "Assigned meters retrieved successfully");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.getAssignedMeters = getAssignedMeters;
const decommissionMeter = async (req, res) => {
    try {
        const dto = req.body;
        if (!req.user?.id)
            throw new Error("Unauthorized");
        const result = await service.decommissionMeter({
            ...dto,
            decommissionedBy: req.user.id,
        });
        (0, response_1.sendSuccess)(res, result, "Meter decommissioned and confirmed by device", 200);
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.decommissionMeter = decommissionMeter;
const getDecommissionLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, meterId, hhid } = req.query;
        const result = await service.getDecommissionLogs({
            page: Number(page),
            limit: Number(limit),
            meterId: meterId,
            hhid: hhid,
        });
        (0, response_1.sendSuccess)(res, result, "Decommission logs retrieved");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.getDecommissionLogs = getDecommissionLogs;
const getHouseholdMeterHistory = async (req, res) => {
    try {
        const { page = 1, limit = 25, meterId, hhid, assigned_from, assigned_to, decommissioned_from, decommissioned_to } = req.query;
        const result = await service.getHouseholdMeterHistory({
            page: Number(page),
            limit: Number(limit),
            meterId: meterId,
            hhid: hhid,
            assigned_from: assigned_from ? new Date(assigned_from) : undefined,
            assigned_to: assigned_to ? new Date(assigned_to) : undefined,
            decommissioned_from: decommissioned_from ? new Date(decommissioned_from) : undefined,
            decommissioned_to: decommissioned_to ? new Date(decommissioned_to) : undefined,
        });
        (0, response_1.sendSuccess)(res, result.data, "Household meter history retrieved", 200, result.pagination);
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.getHouseholdMeterHistory = getHouseholdMeterHistory;
//# sourceMappingURL=decommission.controller.js.map