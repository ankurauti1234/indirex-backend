"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/household/household.routes.ts
const express_1 = require("express");
const household_controller_1 = require("./household.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const User_1 = require("../../database/entities/User");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const household_validation_1 = require("./household.validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER));
// GET /households
router.get("/", (0, validation_middleware_1.validationMiddleware)({ query: household_validation_1.listHouseholdsSchema }), household_controller_1.getHouseholds);
// PATCH /households/:householdId/contact
router.patch("/:householdId/contact", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ householdId: joi_1.default.string().uuid().required() }),
    body: household_validation_1.updateContactSchema,
}), household_controller_1.updatePreassignedContact);
exports.default = router;
