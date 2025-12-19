import Joi from "joi";
import { UserRole } from "../../database/entities/User";

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).required(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .default(UserRole.VIEWER),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
}).min(1);

export const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().optional().allow(""),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid("name", "email", "role", "createdAt", "updatedAt").default("createdAt"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

export const createNewPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

