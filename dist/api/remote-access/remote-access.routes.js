"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/remote-access/remote-access.routes.ts
const express_1 = require("express");
const remote_access_controller_1 = require("./remote-access.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const User_1 = require("../../database/entities/User");
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
router.get("/meters", restrictViewer({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), remote_access_controller_1.listMeters);
exports.default = router;
//# sourceMappingURL=remote-access.routes.js.map