"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnassignLogs = void 0;
const unassign_service_1 = require("../../services/unassign/unassign.service");
const response_1 = require("../../utils/response");
const service = new unassign_service_1.UnassignService();
const getUnassignLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, meterId, hhid } = req.query;
        const result = await service.getLogs({
            page: Number(page),
            limit: Number(limit),
            meterId: meterId,
            hhid: hhid,
        });
        (0, response_1.sendSuccess)(res, result, "Unassign logs retrieved");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.getUnassignLogs = getUnassignLogs;
//# sourceMappingURL=unassign.controller.js.map