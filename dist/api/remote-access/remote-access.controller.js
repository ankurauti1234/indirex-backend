"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMeters = void 0;
const remote_access_service_1 = require("../../services/remote-access/remote-access.service");
const response_1 = require("../../utils/response");
const service = new remote_access_service_1.RemoteAccessService();
const listMeters = async (_req, res) => {
    try {
        const meters = await service.listMeters();
        (0, response_1.sendSuccess)(res, meters, "Active meters");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.listMeters = listMeters;
//# sourceMappingURL=remote-access.controller.js.map