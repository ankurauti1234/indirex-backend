"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreassignedContact = exports.getHouseholds = void 0;
const household_service_1 = require("../../services/household/household.service");
const response_1 = require("../../utils/response");
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
