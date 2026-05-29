"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const device_reports_controller_1 = require("./device-reports.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// GET /api/v1/device-reports/health
router.get("/health", device_reports_controller_1.getHealthReports);
// GET /api/v1/device-reports/silent
router.get("/silent", device_reports_controller_1.getSilentReports);
exports.default = router;
//# sourceMappingURL=index.js.map