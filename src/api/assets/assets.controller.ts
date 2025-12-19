import { Request, Response } from "express";
import { AssetsService } from "../../services/assets/assets.service";
import { sendSuccess, sendError } from "../../utils/response";
import multer from "multer";
import { IotMeterStatus } from "../../database/entities";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
 
const service = new AssetsService();

export const uploadMeters = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) throw new Error("No file uploaded");
      const { groupName } = req.body;
      if (!groupName) throw new Error("groupName required");

      const result = await service.uploadMeters(req.file, groupName, req.user!.id);
      sendSuccess(res, result, "Meters uploaded", 201);
    } catch (e: any) {
      sendError(res, e.message, 400);
    }
  },
];

export const getMeters = async (req: Request, res: Response) => {
  try {
    const { page, limit, meterId, status, powerHATStatus, groupName,meterType } =
      req.query;

    const data = await service.getMeters({
      page: Number(page),
      limit: Number(limit),
      meterId: meterId as string,
      status: status as IotMeterStatus,
      powerHATStatus: powerHATStatus as string,
      groupName: groupName as string,
      meterType: meterType as string,

    });

    sendSuccess(res, data, "Meters listed");
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
}; 


export const updateMeter = async (req: Request, res: Response) => {
  try {
    const { meterId } = req.params;
    const { meterType, assetSerialNumber, powerHATStatus } = req.body;
    const updated = await service.updateMeter(meterId, { meterType, assetSerialNumber, powerHATStatus });
    sendSuccess(res, updated, "Meter updated");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};

export const deleteMeter = async (req: Request, res: Response) => {
  try {
    const { meterId } = req.params;
    await service.deleteMeter(meterId);
    sendSuccess(res, null, "Meter deleted");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};

export const getThingGroups = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const data = await service.getThingGroups({ page: Number(page), limit: Number(limit) });
    sendSuccess(res, data, "Thing groups listed");
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};

export const getThingsInGroup = async (req: Request, res: Response) => {
  try {
    const { groupName } = req.params;
    const { page, limit } = req.query;
    const data = await service.getThingsInGroup(groupName, { page: Number(page), limit: Number(limit) });
    sendSuccess(res, data, "Things in group");
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};

export const getUnregisteredInGroup = async (req: Request, res: Response) => {
  try {
    const { groupName } = req.params;
    const data = await service.getUnregisteredInGroup(groupName);
    sendSuccess(res, data, "Unregistered things in group");
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};