"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportQuerySchema = void 0;
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
