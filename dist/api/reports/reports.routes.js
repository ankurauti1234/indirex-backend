"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/reports/reports.routes.ts
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const reports_validation_1 = require("./reports.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER));
router.get("/", (0, validation_middleware_1.validationMiddleware)({ query: reports_validation_1.reportQuerySchema }), reports_controller_1.getReport);
exports.default = router;
