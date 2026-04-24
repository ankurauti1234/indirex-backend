"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/decommission/decommission.routes.ts
const express_1 = require("express");
const decommission_controller_1 = require("./decommission.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const decommission_validation_1 = require("./decommission.validation");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
// Middleware to return empty data for viewer role
const restrictViewer = (emptyData) => (req, res, next) => {
    if (req.user?.role === User_1.UserRole.VIEWER) {
        return response_1.sendSuccess(res, emptyData, "Viewer Restricted Access");
    }
    next();
};
router.use(auth_middleware_1.protect);
router.get("/assigned", restrictViewer({ meters: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), (0, validation_middleware_1.validationMiddleware)({ query: decommission_validation_1.listAssignedMetersSchema }), decommission_controller_1.getAssignedMeters);
router.post("/decommission", (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER), (0, validation_middleware_1.validationMiddleware)({ body: decommission_validation_1.decommissionMeterSchema }), decommission_controller_1.decommissionMeter);
router.get("/logs", restrictViewer({ logs: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), (0, validation_middleware_1.validationMiddleware)({ query: decommission_validation_1.getDecommissionLogsSchema }), decommission_controller_1.getDecommissionLogs);
exports.default = router;
//# sourceMappingURL=decommission.routes.js.map