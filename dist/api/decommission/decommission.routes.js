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
const router = (0, express_1.Router)();
// All routes require admin
router.use(auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER));
router.get("/assigned", (0, validation_middleware_1.validationMiddleware)({ query: decommission_validation_1.listAssignedMetersSchema }), decommission_controller_1.getAssignedMeters);
router.post("/decommission", (0, validation_middleware_1.validationMiddleware)({ body: decommission_validation_1.decommissionMeterSchema }), decommission_controller_1.decommissionMeter);
router.get("/logs", (0, validation_middleware_1.validationMiddleware)({ query: decommission_validation_1.getDecommissionLogsSchema }), decommission_controller_1.getDecommissionLogs);
exports.default = router;
