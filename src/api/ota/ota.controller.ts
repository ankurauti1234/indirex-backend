// src/api/ota/ota.controller.ts
import { Request, Response } from "express";
import { OtaService } from "../../services/ota/ota.service";
import { sendSuccess, sendError } from "../../utils/response";
import multer from "multer";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/octet-stream" || file.mimetype.startsWith("application/") || file.mimetype.startsWith("text/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

const service = new OtaService();

export const createJob = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) throw new Error("No file uploaded");
      if (!req.user) throw new Error("Unauthorized");

      const { version, bucketName, thingGroupName, thingNames, downloadPath } = req.body;
      const job = await service.createOtaJob(req.file, req.user, {
        version,
        bucketName: bucketName || process.env.DEFAULT_S3_BUCKET!,
        thingGroupName,
        thingNames,
        downloadPath,
      });

      sendSuccess(res, job, "OTA Job created", 201);
    } catch (e: any) {
      sendError(res, e.message, 400);
    }
  },
];

export const getMyJobs = async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new Error("Unauthorized");
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const data = await service.getJobsByUser(req.user.id, page, limit);
    sendSuccess(res, data, "Your OTA jobs");
  } catch (e: any) {
    sendError(res, e.message, 400);
  }
};