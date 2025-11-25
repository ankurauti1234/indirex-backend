"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/remote-access/remote-access.routes.ts
const express_1 = require("express");
const remote_access_controller_1 = require("./remote-access.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER));
router.get("/meters", remote_access_controller_1.listMeters);
exports.default = router;
