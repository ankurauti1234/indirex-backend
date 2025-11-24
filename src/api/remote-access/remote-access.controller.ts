// src/api/remote-access/remote-access.controller.ts
import { Request, Response } from "express";
import { RemoteAccessService } from "../../services/remote-access/remote-access.service";
import { sendSuccess, sendError } from "../../utils/response";

const service = new RemoteAccessService();

export const listMeters = async (_req: Request, res: Response) => {
  try {
    const meters = await service.listMeters();
    sendSuccess(res, meters, "Active meters");
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};
