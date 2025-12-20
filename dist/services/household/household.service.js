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
exports.HouseholdService = void 0;
const connection_1 = require("../../database/connection");
const Household_1 = require("../../database/entities/Household");
const Member_1 = require("../../database/entities/Member");
const PreregisteredContact_1 = require("../../database/entities/PreregisteredContact");
const MeterAssignment_1 = require("../../database/entities/MeterAssignment");
const csv_parser_1 = __importDefault(require("csv-parser"));
const xlsx_1 = __importDefault(require("xlsx"));
const stream = __importStar(require("stream"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const env_1 = require("../../config/env");
// Initialize SES
const ses = new aws_sdk_1.default.SES({
    region: env_1.env.aws.region || "ap-south-1",
    apiVersion: "2010-12-01",
});
class HouseholdService {
    constructor() {
        this.householdRepo = connection_1.AppDataSource.getRepository(Household_1.Household);
        this.memberRepo = connection_1.AppDataSource.getRepository(Member_1.Member);
        this.contactRepo = connection_1.AppDataSource.getRepository(PreregisteredContact_1.PreregisteredContact);
        this.assignmentRepo = connection_1.AppDataSource.getRepository(MeterAssignment_1.MeterAssignment);
    }
    async getHouseholds(filters) {
        const page = Math.max(filters.page || 1, 1);
        const limit = Math.min(filters.limit || 10, 100);
        const skip = (page - 1) * limit;
        const queryBuilder = this.householdRepo.createQueryBuilder("h")
            .leftJoinAndSelect("h.contacts", "contact", "contact.isActive = :active", { active: true })
            .leftJoinAndSelect("h.assignments", "assignment")
            .leftJoinAndSelect("assignment.meter", "meter")
            .leftJoinAndSelect("h.members", "member") // Critical: Load members
            .where("1 = 1");
        if (filters.search) {
            queryBuilder.andWhere("h.hhid ILIKE :search", { search: `%${filters.search}%` });
        }
        if (filters.groupName) {
            queryBuilder.andWhere("meter.groupName = :groupName", { groupName: filters.groupName });
        }
        if (filters.contactEmail) {
            queryBuilder.andWhere("contact.contactEmail = :contactEmail", { contactEmail: filters.contactEmail });
        }
        if (filters.assigned === "true") {
            queryBuilder.andWhere("assignment.id IS NOT NULL");
        }
        else if (filters.assigned === "false") {
            queryBuilder.andWhere("assignment.id IS NULL");
        }
        const [households, total] = await queryBuilder
            .orderBy("h.createdAt", "DESC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const enriched = households.map(h => ({
            id: h.id,
            hhid: h.hhid,
            createdAt: h.createdAt,
            isAssigned: h.assignments.length > 0,
            assignedMeterId: h.assignments[0]?.meter?.meterId || null,
            preassignedContact: h.contacts[0] ? {
                email: h.contacts[0].contactEmail,
                isActive: h.contacts[0].isActive,
            } : null,
            memberCount: h.members.length, // Now correct!
        }));
        return {
            households: enriched,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async updatePreassignedContact(householdId, contactEmail) {
        const household = await this.householdRepo.findOne({
            where: { id: householdId },
            relations: ["contacts", "members", "assignments", "assignments.meter"],
        });
        if (!household)
            throw new Error("Household not found");
        const normalizedEmail = contactEmail.trim().toLowerCase();
        // === 1. Check if email is already verified in SES ===
        let isVerified = false;
        try {
            const verifiedIdentities = await ses
                .listIdentities({ IdentityType: "EmailAddress" })
                .promise();
            if (verifiedIdentities.Identities?.includes(normalizedEmail)) {
                const verificationAttrs = await ses
                    .getIdentityVerificationAttributes({
                    Identities: [normalizedEmail],
                })
                    .promise();
                const attrs = verificationAttrs.VerificationAttributes[normalizedEmail];
                if (attrs?.VerificationStatus === "Success") {
                    isVerified = true;
                }
            }
        }
        catch (err) {
            console.warn("SES verification check failed (might be sandbox):", err);
            // In sandbox, listIdentities may be restricted — we'll just proceed to send verification
        }
        // === 2. If not verified → send verification email via SES ===
        if (!isVerified) {
            try {
                await ses
                    .verifyEmailIdentity({ EmailAddress: normalizedEmail })
                    .promise();
                console.log(`Verification email sent to ${normalizedEmail}`);
                // Note: In production, this adds to verified list after user clicks link
                // In sandbox, this sends a real verification email
            }
            catch (err) {
                if (err.code === "InvalidParameterValue") {
                    throw new Error("Invalid email address");
                }
                console.warn("SES verifyEmailIdentity failed:", err.message);
                // Continue anyway — user will get verification email
            }
        }
        // === 3. Update or create the contact in DB ===
        let contact = household.contacts?.[0];
        if (contact) {
            contact.contactEmail = normalizedEmail;
            contact.isActive = true;
        }
        else {
            contact = this.contactRepo.create({
                household,
                contactEmail: normalizedEmail,
                isActive: true,
            });
        }
        await this.contactRepo.save(contact);
        const assignment = household.assignments[0];
        return {
            id: household.id,
            hhid: household.hhid,
            createdAt: household.createdAt,
            isAssigned: !!assignment,
            assignedMeterId: assignment?.meter?.meterId || null,
            preassignedContact: {
                email: contact.contactEmail,
                isActive: contact.isActive,
            },
            memberCount: household.members.length,
        };
    }
    // Upload members via CSV/XLSX
    async uploadMembers(file, householdId) {
        const household = await this.householdRepo.findOne({
            where: { id: householdId },
            relations: ["members"],
        });
        if (!household)
            throw new Error("Household not found");
        const isCSV = file.originalname.endsWith(".csv") || file.mimetype.includes("csv");
        const isXLSX = file.originalname.endsWith(".xlsx") || file.mimetype.includes("spreadsheet");
        if (!isCSV && !isXLSX)
            throw new Error("Only CSV or XLSX files allowed");
        const results = [];
        const errors = [];
        let rowIndex = 1;
        return new Promise((resolve, reject) => {
            let parser;
            if (isCSV) {
                const readable = stream.Readable.from([file.buffer]);
                parser = readable.pipe((0, csv_parser_1.default)({
                    mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ""),
                }));
            }
            else {
                const workbook = xlsx_1.default.read(file.buffer, { type: "buffer" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = xlsx_1.default.utils.sheet_to_json(sheet, { defval: "" });
                const readable = new stream.Readable({
                    objectMode: true,
                    read() {
                        json.forEach(row => this.push(row));
                        this.push(null);
                    },
                });
                parser = readable;
            }
            parser
                .on("data", (row) => {
                rowIndex++;
                const memberCode = String(row.memberCode || row.MemberCode || row["Member Code"] || row.member_code || "").trim();
                const dobStr = String(row.dob || row.DOB || row["Date of Birth"] || row.birthDate || "").trim();
                const gender = String(row.gender || row.Gender || row.sex || "").trim().toUpperCase();
                if (!memberCode) {
                    errors.push(`Row ${rowIndex}: memberCode is required`);
                    return;
                }
                if (!dobStr) {
                    errors.push(`Row ${rowIndex}: DOB is required`);
                    return;
                }
                let dob;
                try {
                    dob = new Date(dobStr);
                    if (isNaN(dob.getTime()))
                        throw new Error("Invalid date");
                }
                catch {
                    errors.push(`Row ${rowIndex}: Invalid DOB format (use YYYY-MM-DD)`);
                    return;
                }
                if (gender && !["MALE", "FEMALE", "OTHER"].includes(gender)) {
                    errors.push(`Row ${rowIndex}: Gender must be MALE, FEMALE, or OTHER`);
                    return;
                }
                results.push({
                    household,
                    memberCode,
                    dob,
                    gender: gender || undefined,
                });
            })
                .on("end", async () => {
                try {
                    // Check existing member codes to avoid duplicates
                    const existingCodes = household.members.map(m => m.memberCode);
                    const newMembers = results.filter(m => !existingCodes.includes(m.memberCode));
                    const saved = await this.memberRepo.save(newMembers);
                    resolve({
                        uploaded: results.length,
                        saved: saved.length,
                        skipped: results.length - saved.length,
                        errors,
                    });
                }
                catch (err) {
                    reject(err);
                }
            })
                .on("error", reject);
        });
    }
    async deleteMember(memberId) {
        const member = await this.memberRepo.findOne({
            where: { id: memberId },
        });
        if (!member)
            throw new Error("Member not found");
        await this.memberRepo.remove(member);
    }
}
exports.HouseholdService = HouseholdService;
//# sourceMappingURL=household.service.js.map