"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/dashboard/dashboard.routes.ts
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// GET /api/v1/dashboard/stats
router.get("/stats", dashboard_controller_1.getDashboardStats);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map