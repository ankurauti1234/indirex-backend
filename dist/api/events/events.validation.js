"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventTypeQuerySchema = exports.eventsQuerySchema = void 0;
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
//# sourceMappingURL=events.validation.js.map