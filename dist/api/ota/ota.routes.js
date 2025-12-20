"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/ota/ota.routes.ts
const express_1 = require("express");
const ota_controller_1 = require("./ota.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const ota_validation_1 = require("./ota.validation"); // import new schema
const router = (0, express_1.Router)();
// Only logged-in developers/admins
router.use(auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER));
router.post("/create-job", (0, validation_middleware_1.validationMiddleware)({ body: ota_validation_1.createOtaJobSchema }), ...ota_controller_1.createJob);
router.get("/my-jobs", (0, validation_middleware_1.validationMiddleware)({ query: ota_validation_1.getMyJobsSchema }), // ← Add query validation
ota_controller_1.getMyJobs);
exports.default = router;
//# sourceMappingURL=ota.routes.js.map