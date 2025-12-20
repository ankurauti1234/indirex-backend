"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/assets/assets.routes.ts
const express_1 = require("express");
const assets_controller_1 = require("./assets.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const assets_validation_1 = require("./assets.validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER));
// POST /assets/upload
router.post("/upload", (0, validation_middleware_1.validationMiddleware)({ body: assets_validation_1.uploadSchema }), assets_controller_1.uploadMeters);
// GET /assets/meters
router.get("/meters", (0, validation_middleware_1.validationMiddleware)({ query: assets_validation_1.listMetersSchema }), assets_controller_1.getMeters);
// PUT /assets/meters/:meterId
router.put("/meters/:meterId", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ meterId: joi_1.default.string().required() }),
    body: assets_validation_1.updateMeterSchema,
}), assets_controller_1.updateMeter);
// DELETE /assets/meters/:meterId
router.delete("/meters/:meterId", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ meterId: joi_1.default.string().required() }),
}), assets_controller_1.deleteMeter);
// GET /assets/groups
router.get("/groups", (0, validation_middleware_1.validationMiddleware)({ query: assets_validation_1.groupsSchema }), assets_controller_1.getThingGroups);
// GET /assets/groups/:groupName
router.get("/groups/:groupName", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ groupName: joi_1.default.string().required() }),
    query: assets_validation_1.groupThingsSchema,
}), assets_controller_1.getThingsInGroup);
// GET /assets/groups/:groupName/unregistered
router.get("/groups/:groupName/unregistered", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ groupName: joi_1.default.string().required() }),
}), assets_controller_1.getUnregisteredInGroup);
exports.default = router;
//# sourceMappingURL=assets.routes.js.map