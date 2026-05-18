"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/reports/reports.routes.ts
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const User_1 = require("../../database/entities/User");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const reports_validation_1 = require("./reports.validation");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
// Middleware to return empty data for viewer role
const restrictViewer = (emptyData) => (req, res, next) => {
    if (req.user?.role === User_1.UserRole.VIEWER) {
        return (0, response_1.sendSuccess)(res, emptyData, "Viewer Restricted Access");
    }
    next();
};
router.use(auth_middleware_1.protect);
router.get("/", (0, validation_middleware_1.validationMiddleware)({ query: reports_validation_1.reportQuerySchema }), restrictViewer([]), reports_controller_1.getReport);
router.get("/bridge", (0, validation_middleware_1.validationMiddleware)({ query: reports_validation_1.reportQuerySchema }), restrictViewer([]), reports_controller_1.getBridge);
router.get("/unbridge", (0, validation_middleware_1.validationMiddleware)({ query: reports_validation_1.reportQuerySchema }), restrictViewer([]), reports_controller_1.getUnbridge);
router.get("/memberwise-bridge", (0, validation_middleware_1.validationMiddleware)({ query: reports_validation_1.reportQuerySchema }), restrictViewer([]), reports_controller_1.getMemberwiseBridge);
router.get("/memberwise-unbridge", (0, validation_middleware_1.validationMiddleware)({ query: reports_validation_1.reportQuerySchema }), restrictViewer([]), reports_controller_1.getMemberwiseUnbridge);
router.get("/viewership-csv", (0, validation_middleware_1.validationMiddleware)({ query: reports_validation_1.viewershipCSVQuerySchema }), reports_controller_1.getViewershipCSVReports);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map