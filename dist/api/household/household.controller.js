"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewHouseholds = exports.getPreregisteredEmails = exports.assignMembersManually = exports.deleteHouseholdMember = exports.uploadHouseholdMembers = exports.updatePreassignedContact = exports.getHouseholds = void 0;
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
const assignMembersManually = async (req, res) => {
    try {
        const { hhid, contactEmail, members, region } = req.body;
        const result = await service.assignMembersManually(hhid, contactEmail, members, region);
        const message = result.householdCreated
            ? `Household "${hhid}" created and ${result.saved} member(s) assigned`
            : `${result.saved} member(s) assigned to ${hhid}`;
        (0, response_1.sendSuccess)(res, result, message, 201);
    }
    catch (e) {
        const status = e.message?.includes("already has members") ? 409 : 400;
        (0, response_1.sendError)(res, e.message, status);
    }
};
exports.assignMembersManually = assignMembersManually;
const getPreregisteredEmails = async (req, res) => {
    try {
        const { search } = req.query;
        const emails = await service.getPreregisteredEmails(search);
        (0, response_1.sendSuccess)(res, emails, "Emails listed");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getPreregisteredEmails = getPreregisteredEmails;
const getNewHouseholds = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
        const search = req.query.search || "";
        const skip = (page - 1) * limit;
        const searchCondition = search
            ? `AND h.hhid ILIKE $3`
            : "";
        const params = [limit, skip];
        if (search)
            params.push(`%${search}%`);
        // HHIDs that have NEVER been in meter_assignments or household_meter_history
        const query = `
      SELECT
        h.id,
        h.hhid,
        COALESCE(h.region, '—') AS region,
        h.created_at,
        COUNT(*) OVER() AS total_count
      FROM households h
      WHERE NOT EXISTS (
        SELECT 1 FROM meter_assignments ma WHERE ma.household_id = h.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM household_meter_history hmh WHERE hmh.household_id = h.id
      )
      ${searchCondition}
      ORDER BY h.created_at DESC
      LIMIT $1 OFFSET $2
    `;
        const rows = await (await Promise.resolve().then(() => __importStar(require("../../database/connection")))).AppDataSource.query(query, params);
        const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
        (0, response_1.sendSuccess)(res, {
            households: rows.map((r) => ({
                id: r.id,
                hhid: r.hhid,
                region: r.region,
                createdAt: r.created_at,
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        }, "New households fetched");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getNewHouseholds = getNewHouseholds;
//# sourceMappingURL=household.controller.js.map