"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnassignLogsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.getUnassignLogsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(20),
    meterId: joi_1.default.string().optional().allow(""),
    hhid: joi_1.default.string().optional().allow(""),
});
//# sourceMappingURL=unassign.validation.js.map