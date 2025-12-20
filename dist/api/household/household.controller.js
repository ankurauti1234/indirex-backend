"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHouseholdMember = exports.uploadHouseholdMembers = exports.updatePreassignedContact = exports.getHouseholds = void 0;
const household_service_1 = require("../../services/household/household.service");
const response_1 = require("../../utils/response");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const service = new household_service_1.HouseholdService();
const getHouseholds = async (req, res) => {
    try {
        const { search, assigned, groupName, contactEmail, page, limit } = req.query;
        const data = await service.getHouseholds({
            search: search,
            assigned: assigned,
            groupName: groupName,
            contactEmail: contactEmail,
            page: Number(page),
            limit: Number(limit),
        });
        (0, response_1.sendSuccess)(res, data, "Households listed");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getHouseholds = getHouseholds;
const updatePreassignedContact = async (req, res) => {
    try {
        const { householdId } = req.params;
        const { contactEmail } = req.body;
        if (!contactEmail)
            throw new Error("contactEmail required");
        const updated = await service.updatePreassignedContact(householdId, contactEmail);
        (0, response_1.sendSuccess)(res, updated, "Preassigned contact updated");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.updatePreassignedContact = updatePreassignedContact;
exports.uploadHouseholdMembers = [
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file)
                throw new Error("No file uploaded");
            const { householdId } = req.body;
            if (!householdId)
                throw new Error("householdId is required in form data");
            const result = await service.uploadMembers(req.file, householdId);
            (0, response_1.sendSuccess)(res, result, "Members uploaded successfully", 201);
        }
        catch (e) {
            (0, response_1.sendError)(res, e.message, 400);
        }
    },
];
const deleteHouseholdMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        await service.deleteMember(memberId);
        (0, response_1.sendSuccess)(res, null, "Member deleted successfully");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.deleteHouseholdMember = deleteHouseholdMember;
//# sourceMappingURL=household.controller.js.map