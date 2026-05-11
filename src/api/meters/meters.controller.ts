// src/api/meters/meters.controller.ts
import { Request, Response } from "express";
import { AppDataSource } from "../../database/connection";
import { Meter } from "../../database/entities/Meter";
import { sendSuccess, sendError } from "../../utils/response";

// Reusable range condition for IM000101 – IM000600
const IM_RANGE_CONDITION = `
  meter.meterId LIKE 'IM%'
  AND CAST(SUBSTRING(meter.meterId FROM 3) AS INTEGER) BETWEEN :minNum AND :maxNum
`;
const IM_RANGE_PARAMS = { minNum: 101, maxNum: 600 };

// GET /api/v1/meters/stats
export const getMeterStats = async (req: Request, res: Response) => {
  try {
    const meterRepo = AppDataSource.getRepository(Meter);

    const [totalInstalled, totalMeters] = await Promise.all([
      meterRepo
        .createQueryBuilder("meter")
        .where("meter.isAssigned = :isAssigned", { isAssigned: true })
        .andWhere(IM_RANGE_CONDITION, IM_RANGE_PARAMS)
        .getCount(),
      meterRepo
        .createQueryBuilder("meter")
        .where(IM_RANGE_CONDITION, IM_RANGE_PARAMS)
        .getCount(),
    ]);

    sendSuccess(
      res,
      {
        totalInstalled,
        totalMeters,
        totalUninstalled: totalMeters - totalInstalled,
      },
      "Meter stats fetched"
    );
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};

// GET /api/v1/meters/installed
export const getInstalledMeters = async (req: Request, res: Response) => {
  try {
    const meterRepo = AppDataSource.getRepository(Meter);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = (req.query.search as string) || "";
    const dateFrom = (req.query.dateFrom as string) || "";
    const dateTo = (req.query.dateTo as string) || "";
    const skip = (page - 1) * limit;

    const qb = meterRepo
      .createQueryBuilder("meter")
      .leftJoinAndSelect("meter.assignedHousehold", "household")
      .where("meter.isAssigned = :isAssigned", { isAssigned: true })
      .andWhere(IM_RANGE_CONDITION, IM_RANGE_PARAMS);

    if (search) {
      qb.andWhere(
        "(meter.meterId ILIKE :search OR household.hhid ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (dateFrom) {
      qb.andWhere("meter.updatedAt >= :dateFrom", {
        dateFrom: new Date(dateFrom + "T00:00:00.000Z"),
      });
    }

    if (dateTo) {
      qb.andWhere("meter.updatedAt <= :dateTo", {
        dateTo: new Date(dateTo + "T23:59:59.999Z"),
      });
    }

    const [meters, total] = await qb
      .orderBy("meter.updatedAt", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const result = meters.map((m) => ({
      meterId: m.meterId,
      assignedHouseholdId: m.assignedHousehold?.hhid ?? null,
      meterType: m.meterType ?? null,
      assetSerialNumber: m.assetSerialNumber ?? null,
      installedAt: m.updatedAt,
    }));

    sendSuccess(
      res,
      {
        meters: result,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Installed meters fetched"
    );
  } catch (e: any) {
    sendError(res, e.message, 500);
  }
};