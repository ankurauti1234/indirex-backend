"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const auth_validation_1 = require("./auth.validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
/* Public */
router.post("/login", (0, validation_middleware_1.validationMiddleware)({ body: auth_validation_1.loginSchema }), auth_controller_1.login);
router.post("/refresh-token", (0, validation_middleware_1.validationMiddleware)({ body: auth_validation_1.refreshTokenSchema }), auth_controller_1.refreshToken);
/* Protected */
router.post("/change-password", auth_middleware_1.protect, (0, validation_middleware_1.validationMiddleware)({ body: auth_validation_1.changePasswordSchema }), auth_controller_1.changePassword);
router.get("/me", auth_middleware_1.protect, auth_controller_1.getMe);
router.get("/users", auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN), (0, validation_middleware_1.validationMiddleware)({ query: auth_validation_1.getUsersSchema }), auth_controller_1.getAllUsers);
/* Admin only */
router.post("/create-user", auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN), (0, validation_middleware_1.validationMiddleware)({ body: auth_validation_1.createUserSchema }), auth_controller_1.createUser);
router.patch("/users/:id", auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN), (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ id: joi_1.default.number().required() }),
    body: auth_validation_1.updateUserSchema,
}), auth_controller_1.updateUser);
router.delete("/users/:id", auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN), (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ id: joi_1.default.number().required() }),
}), auth_controller_1.deleteUser);
exports.default = router;
