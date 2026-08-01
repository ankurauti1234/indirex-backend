"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnassignService = void 0;
const connection_1 = require("../../database/connection");
const UnassignLog_1 = require("../../database/entities/UnassignLog");
const Meter_1 = require("../../database/entities/Meter");
const Household_1 = require("../../database/entities/Household");
class UnassignService {
    constructor() {
        this.logRepo = connection_1.AppDataSource.getRepository(UnassignLog_1.UnassignLog);
        this.meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
        this.householdRepo = connection_1.AppDataSource.getRepository(Household_1.Household);
    }
    async writeLog(params) {
        const meter = await this.meterRepo.findOneBy({ meterId: params.meterId });
        const household = await this.householdRepo.findOneBy({ hhid: params.hhid });
        if (!meter || !household)
            return; // silently skip if not found
        const log = this.logRepo.create({
            meter,
            household,
            unassignedByUserId: params.unassignedByUserId ?? null,
        });
        await this.logRepo.save(log);
    }
    async getLogs(params) {
        const { page, limit, meterId, hhid } = params;
        const qb = this.logRepo
            .createQueryBuilder("log")
            .leftJoinAndSelect("log.meter", "meter")
            .leftJoinAndSelect("log.household", "household")
            .leftJoinAndSelect("log.unassignedBy", "user")
            .orderBy("log.unassignedAt", "DESC");
        if (meterId?.trim())
            qb.andWhere("meter.meterId ILIKE :meterId", { meterId: `%${meterId.trim()}%` });
        if (hhid?.trim())
            qb.andWhere("household.hhid ILIKE :hhid", { hhid: `%${hhid.trim()}%` });
        const [logs, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
        return {
            data: logs.map((l) => ({
                id: l.id,
                deviceId: l.meter.meterId,
                hhid: l.household.hhid,
                unassignedBy: l.unassignedBy ? { name: l.unassignedBy.name, email: l.unassignedBy.email } : null,
                unassignedAt: l.unassignedAt,
            })),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
exports.UnassignService = UnassignService;
//# sourceMappingURL=unassign.service.js.map