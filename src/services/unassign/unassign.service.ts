import { AppDataSource } from "../../database/connection";
import { UnassignLog } from "../../database/entities/UnassignLog";
import { Meter } from "../../database/entities/Meter";
import { Household } from "../../database/entities/Household";

interface GetUnassignLogsParams {
  page: number;
  limit: number;
  meterId?: string;
  hhid?: string;
}

export class UnassignService {
  private logRepo = AppDataSource.getRepository(UnassignLog);
  private meterRepo = AppDataSource.getRepository(Meter);
  private householdRepo = AppDataSource.getRepository(Household);

  async writeLog(params: {
    meterId: string;   // e.g. "IM000101"
    hhid: string;
    unassignedByUserId: string | null;
  }): Promise<void> {
    const meter = await this.meterRepo.findOneBy({ meterId: params.meterId });
    const household = await this.householdRepo.findOneBy({ hhid: params.hhid });
    if (!meter || !household) return; // silently skip if not found

    const log = this.logRepo.create({
      meter,
      household,
      unassignedByUserId: params.unassignedByUserId ?? null,
    });
    await this.logRepo.save(log);
  }

  async getLogs(params: GetUnassignLogsParams) {
    const { page, limit, meterId, hhid } = params;

    const qb = this.logRepo
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.meter", "meter")
      .leftJoinAndSelect("log.household", "household")
      .leftJoinAndSelect("log.unassignedBy", "user")
      .orderBy("log.unassignedAt", "DESC");

    if (meterId?.trim()) qb.andWhere("meter.meterId ILIKE :meterId", { meterId: `%${meterId.trim()}%` });
    if (hhid?.trim())    qb.andWhere("household.hhid ILIKE :hhid",   { hhid:   `%${hhid.trim()}%`   });

    const [logs, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    return {
      data: logs.map((l) => ({
        id:             l.id,
        deviceId:       l.meter.meterId,
        hhid:           l.household.hhid,
        unassignedBy:   l.unassignedBy ? { name: l.unassignedBy.name, email: l.unassignedBy.email } : null,
        unassignedAt:   l.unassignedAt,
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}