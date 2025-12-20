"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterChannelService = void 0;
const connection_1 = require("../../database/connection");
const MeterChannel_1 = require("../../database/entities/MeterChannel");
class MeterChannelService {
    constructor() {
        this.repo = connection_1.AppDataSource.getRepository(MeterChannel_1.MeterChannel);
    }
    toNum(val) {
        if (val === undefined || val === null || val === "")
            return undefined;
        const n = Number(val);
        return isNaN(n) ? undefined : n;
    }
    async getMeterChannels(filters) {
        const { device_id, status, start_time, end_time, page = 1, limit = 10, } = filters;
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
        }
        else if (start !== undefined) {
            qb.andWhere("channel.timestamp >= :start", { start });
        }
        else if (end !== undefined) {
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
exports.MeterChannelService = MeterChannelService;
//# sourceMappingURL=meter-channel.service.js.map