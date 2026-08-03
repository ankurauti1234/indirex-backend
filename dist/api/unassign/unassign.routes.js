"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const unassign_controller_1 = require("./unassign.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const unassign_validation_1 = require("./unassign.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// GET /api/v1/unassign/logs — admin only
router.get("/logs", (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN), (0, validation_middleware_1.validationMiddleware)({ query: unassign_validation_1.getUnassignLogsSchema }), unassign_controller_1.getUnassignLogs);
exports.default = router;
//# sourceMappingURL=unassign.routes.js.map