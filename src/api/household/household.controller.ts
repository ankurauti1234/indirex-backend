import { Request, Response } from "express";
import { HouseholdService } from "../../services/household/household.service";
import { sendSuccess, sendError } from "../../utils/response";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

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

export const uploadHouseholdMembers = [
  upload.single("file"), 
  async (req: Request, res: Response) => {
    try {
      if (!req.file) throw new Error("No file uploaded");
      const { householdId } = req.body;
      if (!householdId) throw new Error("householdId is required in form data");

      const result = await service.uploadMembers(req.file, householdId);
      sendSuccess(res, result, "Members uploaded successfully", 201);
    } catch (e: any) {
      sendError(res, e.message, 400);
    }
  },
];

export const deleteHouseholdMember = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    await service.deleteMember(memberId);
    sendSuccess(res, null, "Member deleted successfully");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};