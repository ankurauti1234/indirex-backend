"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDecommissionLogs = exports.decommissionMeter = exports.getAssignedMeters = void 0;
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
//# sourceMappingURL=decommission.controller.js.map