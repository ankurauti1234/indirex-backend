"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyJobsSchema = exports.createOtaJobSchema = void 0;
const env_1 = require("../../config/env");
const joi_1 = __importDefault(require("joi"));
exports.createOtaJobSchema = joi_1.default.object({
    version: joi_1.default.string().required(),
    bucketName: joi_1.default.string().default(env_1.env.aws.defaultBucket),
    thingGroupName: joi_1.default.string().optional(),
    thingNames: joi_1.default.string().optional(),
    downloadPath: joi_1.default.string().min(1).required(),
});
exports.getMyJobsSchema = joi_1.default.object({
    search: joi_1.default.string().optional(),
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(50).default(10),
});
//# sourceMappingURL=ota.validation.js.map