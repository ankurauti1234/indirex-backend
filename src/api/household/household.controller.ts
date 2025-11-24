// src/api/household/household.controller.ts
import { Request, Response } from "express";
import { HouseholdService } from "../../services/household/household.service";
import { sendSuccess, sendError } from "../../utils/response";

const service = new HouseholdService();

export const getHouseholds = async (req: Request, res: Response) => {
  try {
    const { search, assigned, groupName, contactEmail, page, limit } = req.query;
    const data = await service.getHouseholds({
      search: search as string,
      assigned: assigned as "true" | "false",
      groupName: groupName as string,
      contactEmail: contactEmail as string,
      page: Number(page),
      limit: Number(limit),
    });
    sendSuccess(res, data, "Households listed");
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};

export const updatePreassignedContact = async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    const { contactEmail } = req.body;
    if (!contactEmail) throw new Error("contactEmail required");

    const updated = await service.updatePreassignedContact(householdId, contactEmail);
    sendSuccess(res, updated, "Preassigned contact updated");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};