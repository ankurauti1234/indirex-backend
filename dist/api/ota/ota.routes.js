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
// Only logged-in developers/admins
router.post("/create-job", (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER), (0, validation_middleware_1.validationMiddleware)({ body: ota_validation_1.createOtaJobSchema }), ...ota_controller_1.createJob);
router.get("/my-jobs", restrictViewer({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), (0, validation_middleware_1.validationMiddleware)({ query: ota_validation_1.getMyJobsSchema }), // ← Add query validation
ota_controller_1.getMyJobs);
exports.default = router;
//# sourceMappingURL=ota.routes.js.map