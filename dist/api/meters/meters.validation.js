"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unassignMeterSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.unassignMeterSchema = joi_1.default.object({
    hhid: joi_1.default.string().trim().required(),
    meterId: joi_1.default.string().trim().required(),
});
//# sourceMappingURL=meters.validation.js.map