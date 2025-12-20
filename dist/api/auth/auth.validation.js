"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewPasswordSchema = exports.getUsersSchema = exports.updateUserSchema = exports.refreshTokenSchema = exports.createUserSchema = exports.changePasswordSchema = exports.loginSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../../database/entities/User");
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
exports.changePasswordSchema = joi_1.default.object({
    oldPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().min(8).required(),
});
exports.createUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    name: joi_1.default.string().min(2).required(),
    role: joi_1.default.string()
        .valid(...Object.values(User_1.UserRole))
        .default(User_1.UserRole.VIEWER),
});
exports.refreshTokenSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required(),
});
exports.updateUserSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).optional(),
    role: joi_1.default.string()
        .valid(...Object.values(User_1.UserRole))
        .optional(),
}).min(1);
exports.getUsersSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    search: joi_1.default.string().trim().optional().allow(""),
    role: joi_1.default.string()
        .valid(...Object.values(User_1.UserRole))
        .optional(),
    isActive: joi_1.default.boolean().optional(),
    sortBy: joi_1.default.string().valid("name", "email", "role", "createdAt", "updatedAt").default("createdAt"),
    sortOrder: joi_1.default.string().valid("ASC", "DESC").default("DESC"),
});
exports.createNewPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
});
//# sourceMappingURL=auth.validation.js.map