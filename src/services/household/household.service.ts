// src/services/household/household.service.ts
import { AppDataSource } from "../../database/connection";
import { Household } from "../../database/entities/Household";
import { Meter } from "../../database/entities/Meter";
import { PreregisteredContact } from "../../database/entities/PreregisteredContact";
import { MeterAssignment } from "../../database/entities/MeterAssignment";
import { In, ILike } from "typeorm";

export interface HouseholdFilters {
  search?: string;
  assigned?: "true" | "false";
  groupName?: string;
  contactEmail?: string;
  page?: number;
  limit?: number;
}

export interface EnrichedHousehold {
  id: string;
  hhid: string;
  createdAt: Date;
  isAssigned: boolean;
  assignedMeterId?: string | null;
  preassignedContact?: {
    email: string;
    isActive: boolean;
  } | null;
  memberCount: number;
}

export interface PaginatedHouseholds {
  households: EnrichedHousehold[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class HouseholdService {
  private householdRepo = AppDataSource.getRepository(Household);
  private meterRepo = AppDataSource.getRepository(Meter);
  private contactRepo = AppDataSource.getRepository(PreregisteredContact);
  private assignmentRepo = AppDataSource.getRepository(MeterAssignment);

  async getHouseholds(filters: HouseholdFilters): Promise<PaginatedHouseholds> {
    const page = Math.max(filters.page || 1, 1);
    const limit = Math.min(filters.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.hhid = ILike(`%${filters.search}%`);
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
    } else if (filters.assigned === "false") {
      queryBuilder.andWhere("assignment.id IS NULL");
    }

    const [households, total] = await queryBuilder
      .orderBy("h.createdAt", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const enriched: EnrichedHousehold[] = households.map(h => ({
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

  async updatePreassignedContact(
    householdId: string,
    contactEmail: string
  ): Promise<EnrichedHousehold> {
    const household = await this.householdRepo.findOne({
      where: { id: householdId },
      relations: ["contacts"],
    });
    if (!household) throw new Error("Household not found");

    let contact = household.contacts?.[0];
    if (contact) {
      contact.contactEmail = contactEmail;
      contact.isActive = true;
    } else {
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