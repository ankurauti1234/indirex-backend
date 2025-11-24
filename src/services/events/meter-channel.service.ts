import { AppDataSource } from "../../database/connection";
import { MeterChannel } from "../../database/entities/MeterChannel";

export interface MeterChannelFilters {
  device_id?: string;                 // <-- optional
  status?: "recognized" | "unrecognized";
  start_time?: number;
  end_time?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedMeterChannels {
  channels: MeterChannel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class MeterChannelService {
  private repo = AppDataSource.getRepository(MeterChannel);

  private toNum(val: any): number | undefined {
    if (val === undefined || val === null || val === "") return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }

  async getMeterChannels(filters: MeterChannelFilters): Promise<PaginatedMeterChannels> {
    const {
      device_id,
      status,
      start_time,
      end_time,
      page = 1,
      limit = 10,
    } = filters;

    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const qb = this.repo.createQueryBuilder("channel");

    // Only filter by device_id when it is present
    if (device_id) {
      qb.andWhere("channel.device_id = :device_id", { device_id });
    }

    if (status) {
      qb.andWhere("channel.status = :status", { status });
    }

    const start = this.toNum(start_time);
    const end = this.toNum(end_time);

    if (start !== undefined && end !== undefined) {
      qb.andWhere("channel.timestamp BETWEEN :start AND :end", { start, end });
    } else if (start !== undefined) {
      qb.andWhere("channel.timestamp >= :start", { start });
    } else if (end !== undefined) {
      qb.andWhere("channel.timestamp <= :end", { end });
    }

    qb.orderBy("channel.timestamp", "DESC")
      .take(take)
      .skip(skip);

    const [channels, total] = await qb.getManyAndCount();

    return {
      channels,
      pagination: {
        page,
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    };
  }
}