"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContactSchema = exports.listHouseholdsSchema = void 0;
// src/api/household/household.validation.ts
const joi_1 = __importDefault(require("joi"));
exports.listHouseholdsSchema = joi_1.default.object({
    search: joi_1.default.string().optional(),
    assigned: joi_1.default.string().valid("true", "false").optional(),
    groupName: joi_1.default.string().optional(),
    contactEmail: joi_1.default.string().email().optional(),
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
});
exports.updateContactSchema = joi_1.default.object({
    contactEmail: joi_1.default.string().email().required(),
});
