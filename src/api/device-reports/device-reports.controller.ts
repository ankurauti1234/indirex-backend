import { Request, Response } from "express";
import { AppDataSource } from "../../database/connection";
import { DeviceHealthReportCSV } from "../../database/entities/DeviceHealthReportCSV";
import { SilentDeviceReportCSV } from "../../database/entities/SilentDeviceReportCSV";
import { sendSuccess, sendError } from "../../utils/response";

async function getReports(
  entity: typeof DeviceHealthReportCSV | typeof SilentDeviceReportCSV,
  req: Request,
  res: Response
) {
  try {
    const page   = Math.max(1, Number(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = (req.query.search as string || "").trim();
    const offset = (page - 1) * limit;

    const qb = AppDataSource.getRepository(entity)
      .createQueryBuilder("r")
      .orderBy("r.createdAt", "DESC");

    if (search) {
      qb.where("r.date_label ILIKE :search OR r.s3_url ILIKE :search", {
        search: `%${search}%`,
      });
    }

    const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();

    sendSuccess(res, {
      data: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
}

export const getHealthReports = (req: Request, res: Response) =>
  getReports(DeviceHealthReportCSV, req, res);

export const getSilentReports = (req: Request, res: Response) =>
  getReports(SilentDeviceReportCSV, req, res);