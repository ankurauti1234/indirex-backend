"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOtaJobSchema = void 0;
// src/api/ota/ota.validation.ts
const env_1 = require("../../config/env");
const joi_1 = __importDefault(require("joi"));
exports.createOtaJobSchema = joi_1.default.object({
    version: joi_1.default.string().required(),
    bucketName: joi_1.default.string().default(env_1.env.aws.defaultBucket),
    thingGroupName: joi_1.default.string().optional(),
    thingNames: joi_1.default.string().optional(),
    downloadPath: joi_1.default.string().min(1).required(),
});
