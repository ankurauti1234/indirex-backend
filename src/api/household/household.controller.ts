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

export const assignMembersManually = async (req: Request, res: Response) => {
  try {
    const { hhid, contactEmail, members, region } = req.body;
    const result = await service.assignMembersManually(hhid, contactEmail, members, region);
    const message = result.householdCreated
      ? `Household "${hhid}" created and ${result.saved} member(s) assigned`
      : `${result.saved} member(s) assigned to ${hhid}`;
    sendSuccess(res, result, message, 201);
  } catch (e: any) {
    const status = e.message?.includes("already has members") ? 409 : 400;
    sendError(res, e.message, status);
  }
};

export const getPreregisteredEmails = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const emails = await service.getPreregisteredEmails(search as string | undefined);
    sendSuccess(res, emails, "Emails listed");
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};
export const getNewHouseholds = async (req: Request, res: Response) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = (req.query.search as string) || "";
    const skip   = (page - 1) * limit;

    const searchCondition = search
      ? `AND h.hhid ILIKE $3`
      : "";
    const params: any[] = [limit, skip];
    if (search) params.push(`%${search}%`);

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

    const rows = await (await import("../../database/connection")).AppDataSource.query(query, params);

    const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

    sendSuccess(res, {
      households: rows.map((r: any) => ({
        id:        r.id,
        hhid:      r.hhid,
        region:    r.region,
        createdAt: r.created_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }, "New households fetched");
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};