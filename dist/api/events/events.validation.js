"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyConnectivityQuerySchema = exports.householdVisualizationQuerySchema = exports.viewershipQuerySchema = exports.liveMonitoringQuerySchema = exports.eventTypeQuerySchema = exports.eventsQuerySchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.eventsQuerySchema = joi_1.default.object({
    device_id: joi_1.default.string().optional(),
    type: joi_1.default.string()
        .pattern(/^\d+(,\d+)*$/) // Single or comma-separated numbers
        .optional(),
    start_time: joi_1.default.number().min(0).optional(), // Unix timestamp
    end_time: joi_1.default.number().min(0).optional(), // Unix timestamp
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(100).default(10),
});
exports.eventTypeQuerySchema = exports.eventsQuerySchema.keys({
    type: joi_1.default.number().required(), // For /type/:type
});
exports.liveMonitoringQuerySchema = joi_1.default.object({
    device_id: joi_1.default.string().optional(),
    hhid: joi_1.default.string().optional(),
    date: joi_1.default.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(999999).default(25),
});
exports.viewershipQuerySchema = joi_1.default.object({
    device_id: joi_1.default.string().optional(),
    hhid: joi_1.default.string().optional(),
    date: joi_1.default.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateFrom: joi_1.default.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: joi_1.default.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    region: joi_1.default.string().optional(),
    status: joi_1.default.string().valid("Yes", "No").optional(),
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(999999).default(25),
});
exports.householdVisualizationQuerySchema = joi_1.default.object({
    device_id: joi_1.default.string().optional(),
    hhid: joi_1.default.string().optional(),
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(999999).default(500),
});
exports.weeklyConnectivityQuerySchema = joi_1.default.object({
    device_id: joi_1.default.string().optional(),
    hhid: joi_1.default.string().optional(),
    week_start: joi_1.default.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
    status: joi_1.default.string().valid("connected", "disconnected", "partial").optional(),
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(999999).default(25),
});
//# sourceMappingURL=events.validation.js.map