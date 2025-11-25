"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.meterChannelsQuerySchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.meterChannelsQuerySchema = joi_1.default.object({
    device_id: joi_1.default.string().optional(), // <-- now optional
    status: joi_1.default.string().valid("recognized", "unrecognized").optional(),
    start_time: joi_1.default.number().min(0).optional(),
    end_time: joi_1.default.number().min(0).optional(),
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(100).default(10),
});
