"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupThingsSchema = exports.groupsSchema = exports.updateMeterSchema = exports.listMetersSchema = exports.uploadSchema = void 0;
// src/api/assets/assets.validation.ts
const joi_1 = __importDefault(require("joi"));
exports.uploadSchema = joi_1.default.object({
    groupName: joi_1.default.string().required(),
});
exports.listMetersSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    meterId: joi_1.default.string().optional(),
    status: joi_1.default.string().optional(),
    powerHATStatus: joi_1.default.string().optional(),
    groupName: joi_1.default.string().optional(),
    meterType: joi_1.default.string().optional(),
});
exports.updateMeterSchema = joi_1.default.object({
    meterType: joi_1.default.string().optional(),
    assetSerialNumber: joi_1.default.string().optional(),
    powerHATStatus: joi_1.default.string().optional(),
}).min(1);
exports.groupsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(50).default(10),
});
exports.groupThingsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
});
//# sourceMappingURL=assets.validation.js.map