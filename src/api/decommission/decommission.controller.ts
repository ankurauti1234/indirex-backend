// src/api/decommission/decommission.controller.ts
import { Request, Response } from "express";
import { DecommissionService } from "../../services/decommission/decommission.service";
import { sendSuccess, sendError } from "../../utils/response";

const service = new DecommissionService();

export const getAssignedMeters = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const result = await service.getAssignedMeters({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
    });

    sendSuccess(res, result, "Assigned meters retrieved successfully");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};
 
export const decommissionMeter = async (req: Request, res: Response) => {
  try {
    const dto = req.body;
    if (!req.user?.id) throw new Error("Unauthorized");
 
    const result = await service.decommissionMeter({
      ...dto,
      decommissionedBy: req.user.id,
    }); 

    sendSuccess(res, result, "Meter decommissioned and confirmed by device", 200);
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};

export const getDecommissionLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, meterId, hhid } = req.query;

    const result = await service.getDecommissionLogs({
      page: Number(page),
      limit: Number(limit),
      meterId: meterId as string | undefined,
      hhid: hhid as string | undefined,
    });

    sendSuccess(res, result, "Decommission logs retrieved");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};