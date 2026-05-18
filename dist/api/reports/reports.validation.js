"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewershipCSVQuerySchema = exports.reportQuerySchema = void 0;
// src/api/reports/reports.validation.ts
const joi_1 = __importDefault(require("joi"));
exports.reportQuerySchema = joi_1.default.object({
    type: joi_1.default.string().pattern(/^\d+(,\d+)*$/).optional(),
    start_time: joi_1.default.number().min(0).optional(),
    end_time: joi_1.default.number().min(0).optional(),
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(100).default(10),
    format: joi_1.default.string().valid("json", "csv", "xlsx", "xml").default("json"),
});
exports.viewershipCSVQuerySchema = joi_1.default.object({
    date_label: joi_1.default.string().pattern(/^\d{2}-\d{2}-\d{4}$/).optional(), // DD-MM-YYYY
    month: joi_1.default.string().pattern(/^\d{2}-\d{4}$/).optional(), // MM-YYYY
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(31),
});
//# sourceMappingURL=reports.validation.js.map