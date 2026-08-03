import { Request, Response } from "express";
import { UnassignService } from "../../services/unassign/unassign.service";
import { sendSuccess, sendError } from "../../utils/response";

const service = new UnassignService();

export const getUnassignLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, meterId, hhid } = req.query;
    const result = await service.getLogs({
      page:    Number(page),
      limit:   Number(limit),
      meterId: meterId as string | undefined,
      hhid:    hhid    as string | undefined,
    });
    sendSuccess(res, result, "Unassign logs retrieved");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};