"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preregisteredEmailsSchema = exports.assignMembersManuallySchema = exports.uploadMembersSchema = exports.updateContactSchema = exports.listHouseholdsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.listHouseholdsSchema = joi_1.default.object({
    search: joi_1.default.string().optional(),
    assigned: joi_1.default.string().valid("true", "false").optional(),
    groupName: joi_1.default.string().optional(),
    contactEmail: joi_1.default.string().email().optional(),
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
});
exports.updateContactSchema = joi_1.default.object({
    contactEmail: joi_1.default.string().email().required(),
});
exports.uploadMembersSchema = joi_1.default.object({
    householdId: joi_1.default.string().uuid().required(),
});
exports.assignMembersManuallySchema = joi_1.default.object({
    hhid: joi_1.default.string().required(),
    contactEmail: joi_1.default.string().email().required(),
    members: joi_1.default.array()
        .items(joi_1.default.object({
        memberCode: joi_1.default.string().max(10).required(),
        age: joi_1.default.number().integer().min(0).max(120).required(),
        gender: joi_1.default.string().valid("Male", "Female", "Other").required(),
        dob: joi_1.default.string().isoDate().optional(),
    }))
        .min(1)
        .required(),
});
exports.preregisteredEmailsSchema = joi_1.default.object({
    search: joi_1.default.string().optional().allow(""),
});
//# sourceMappingURL=household.validation.js.map