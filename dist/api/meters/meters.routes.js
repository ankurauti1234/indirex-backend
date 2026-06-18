"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/meters/meters.routes.ts
const express_1 = require("express");
const meters_controller_1 = require("./meters.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const meters_validation_1 = require("./meters.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// GET /api/v1/meters/stats
router.get("/stats", meters_controller_1.getMeterStats);
// GET /api/v1/meters/installed
router.get("/installed", meters_controller_1.getInstalledMeters);
// GET /api/v1/meters/installed/regions
// POST /api/v1/meters/unassign
// Admin only — destructive action (removes a meter-household binding)
router.post("/unassign", (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN), (0, validation_middleware_1.validationMiddleware)({ body: meters_validation_1.unassignMeterSchema }), meters_controller_1.unassignMeter);
exports.default = router;
//# sourceMappingURL=meters.routes.js.map