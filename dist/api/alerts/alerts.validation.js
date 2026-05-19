"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.updateSettingsSchema = exports.addRecipientSchema = void 0;
// src/api/alerts/alerts.validation.ts
const joi_1 = __importDefault(require("joi"));
exports.addRecipientSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    name: joi_1.default.string().max(100).optional().allow("", null),
});
exports.updateSettingsSchema = joi_1.default.object({
    inactivityThresholdHours: joi_1.default.number().integer().min(1).max(720).optional(),
    emailFrequencyHours: joi_1.default.number().integer().min(1).max(720).optional(),
}).min(1);
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(200).default(25),
    device_id: joi_1.default.string().optional().allow(""),
    inactivity_filter: joi_1.default.string()
        .valid("lt_3d", "lt_1w", "lt_2w", "lt_1m", "gt_1m")
        .optional(),
});
//# sourceMappingURL=alerts.validation.js.map