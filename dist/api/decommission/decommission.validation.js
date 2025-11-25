"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDecommissionLogsSchema = exports.listAssignedMetersSchema = exports.decommissionMeterSchema = void 0;
// src/api/decommission/decommission.validation.ts
const joi_1 = __importDefault(require("joi"));
exports.decommissionMeterSchema = joi_1.default.object({
    meterId: joi_1.default.string().required().messages({
        "any.required": "meterId is required",
        "string.empty": "meterId cannot be empty",
    }),
    reason: joi_1.default.string().max(500).optional().allow("").default(null),
});
exports.listAssignedMetersSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(20),
    search: joi_1.default.string().trim().optional().allow(""),
});
exports.getDecommissionLogsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(20),
    meterId: joi_1.default.string().optional(),
    hhid: joi_1.default.string().optional(),
});
