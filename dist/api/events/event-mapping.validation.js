"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEventMappingSchema = exports.createEventMappingSchema = void 0;
// src/api/events/event-mapping.validation.ts
const joi_1 = __importDefault(require("joi"));
exports.createEventMappingSchema = joi_1.default.object({
    type: joi_1.default.number().integer().required(),
    name: joi_1.default.string().min(1).max(100).required(),
    description: joi_1.default.string().max(500).optional().allow(""),
    is_alert: joi_1.default.boolean().default(false),
    severity: joi_1.default.string().valid("low", "medium", "high", "critical").default("medium"),
    enabled: joi_1.default.boolean().default(true),
});
exports.updateEventMappingSchema = exports.createEventMappingSchema.fork(["type", "name"], (schema) => schema.optional());
