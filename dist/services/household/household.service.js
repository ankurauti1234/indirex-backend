"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdService = void 0;
// src/services/household/household.service.ts
const connection_1 = require("../../database/connection");
const Household_1 = require("../../database/entities/Household");
const Meter_1 = require("../../database/entities/Meter");
const PreregisteredContact_1 = require("../../database/entities/PreregisteredContact");
const MeterAssignment_1 = require("../../database/entities/MeterAssignment");
const typeorm_1 = require("typeorm");
class HouseholdService {
    householdRepo = connection_1.AppDataSource.getRepository(Household_1.Household);
    meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
    contactRepo = connection_1.AppDataSource.getRepository(PreregisteredContact_1.PreregisteredContact);
    assignmentRepo = connection_1.AppDataSource.getRepository(MeterAssignment_1.MeterAssignment);
    async getHouseholds(filters) {
        const page = Math.max(filters.page || 1, 1);
        const limit = Math.min(filters.limit || 10, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.search) {
            where.hhid = (0, typeorm_1.ILike)(`%${filters.search}%`);
        }
        const queryBuilder = this.householdRepo.createQueryBuilder("h")
            .leftJoinAndSelect("h.contacts", "contact", "contact.isActive = :active", { active: true })
            .leftJoinAndSelect("h.assignments", "assignment")
            .leftJoinAndSelect("assignment.meter", "meter")
            .where(where);
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
            memberCount: h.members?.length || 0,
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
            relations: ["contacts"],
        });
        if (!household)
            throw new Error("Household not found");
        let contact = household.contacts?.[0];
        if (contact) {
            contact.contactEmail = contactEmail;
            contact.isActive = true;
        }
        else {
            contact = this.contactRepo.create({
                household,
                contactEmail,
                isActive: true,
            });
        }
        await this.contactRepo.save(contact);
        const assignment = await this.assignmentRepo.findOne({
            where: { household: { id: householdId } },
            relations: ["meter"],
        });
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
            memberCount: household.members?.length || 0,
        };
    }
}
exports.HouseholdService = HouseholdService;
