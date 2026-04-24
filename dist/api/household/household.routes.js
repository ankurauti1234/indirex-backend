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
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
// Middleware to return empty data for viewer role
const restrictViewer = (emptyData) => (req, res, next) => {
    if (req.user?.role === User_1.UserRole.VIEWER) {
        return response_1.sendSuccess(res, emptyData, "Viewer Restricted Access");
    }
    next();
};
router.use(auth_middleware_1.protect);
// GET /api/households
router.get("/", restrictViewer({ households: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }), (0, validation_middleware_1.validationMiddleware)({ query: household_validation_1.listHouseholdsSchema }), household_controller_1.getHouseholds);
// PATCH /api/households/:householdId/contact
router.patch("/:householdId/contact", (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER), (0, validation_middleware_1.validationMiddleware)({
    params: joi_1.default.object({ householdId: joi_1.default.string().uuid().required() }),
    body: household_validation_1.updateContactSchema,
}), household_controller_1.updatePreassignedContact);
// POST /api/households/members/upload
router.post("/members/upload", (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER), (0, validation_middleware_1.validationMiddleware)({
    body: household_validation_1.uploadMembersSchema,
}), household_controller_1.uploadHouseholdMembers);
// DELETE /api/households/members/:memberId
router.delete("/members/:memberId", (0, role_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.DEVELOPER), household_controller_1.deleteHouseholdMember);
exports.default = router;
//# sourceMappingURL=household.routes.js.map