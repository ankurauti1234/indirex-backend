"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
// GET /api/households
router.get("/", (0, validation_middleware_1.validationMiddleware)({ query: household_validation_1.listHouseholdsSchema }), household_controller_1.getHouseholds);
// PATCH /api/households/:householdId/contact
router.patch("/:householdId/contact", (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ householdId: joi_1.default.string().uuid().required() }),
    body: household_validation_1.updateContactSchema,
}), household_controller_1.updatePreassignedContact);
// POST /api/households/members/upload
router.post("/members/upload", (0, validation_middleware_1.validationMiddleware)({
    body: household_validation_1.uploadMembersSchema,
}), household_controller_1.uploadHouseholdMembers);
// DELETE /api/households/members/:memberId
router.delete("/members/:memberId", household_controller_1.deleteHouseholdMember);
exports.default = router;
//# sourceMappingURL=household.routes.js.map