"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecommissionService = void 0;
// src/services/decommission/decommission.service.ts
const connection_1 = require("../../database/connection");
const Meter_1 = require("../../database/entities/Meter");
const Household_1 = require("../../database/entities/Household");
const DecommissionLog_1 = require("../../database/entities/DecommissionLog");
const User_1 = require("../../database/entities/User");
const mqtt_client_1 = require("../mqtt/mqtt.client");
class DecommissionService {
    constructor() {
        this.meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
        this.householdRepo = connection_1.AppDataSource.getRepository(Household_1.Household);
        this.logRepo = connection_1.AppDataSource.getRepository(DecommissionLog_1.DecommissionLog);
        this.userRepo = connection_1.AppDataSource.getRepository(User_1.User);
    }
    async getAssignedMeters(params) {
        // ... (unchanged - keep your existing logic)
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;
        const query = this.meterRepo
            .createQueryBuilder("meter")
            .leftJoinAndSelect("meter.assignedHousehold", "household")
            .where("meter.isAssigned = true");
        if (search?.trim()) {
            query.andWhere("(meter.meterId ILIKE :search OR meter.assetSerialNumber ILIKE :search OR household.hhid ILIKE :search)", { search: `%${search.trim()}%` });
        }
        const [meters, total] = await query
            .orderBy("meter.updatedAt", "DESC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return {
            data: meters.map((m) => ({
                id: m.id,
                meterId: m.meterId,
                meterType: m.meterType,
                assetSerialNumber: m.assetSerialNumber,
                household: m.assignedHousehold
                    ? {
                        id: m.assignedHousehold.id,
                        hhid: m.assignedHousehold.hhid,
                    }
                    : null,
                assignedAt: m.updatedAt,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async decommissionMeter(dto) {
        const meter = await this.meterRepo.findOne({
            where: { meterId: dto.meterId, isAssigned: true },
            relations: ["assignedHousehold"],
        });
        if (!meter || !meter.assignedHousehold) {
            throw new Error("Meter not found or not currently assigned to a household");
        }
        const household = meter.assignedHousehold;
        // CRITICAL: Wait for device to confirm decommissioning
        try {
            console.log(`Sending decommission command and waiting for ACK: ${dto.meterId}`);
            await (0, mqtt_client_1.publishDecommissionWithAck)(dto.meterId, 30000); // 30s timeout
            console.log(`Meter ${dto.meterId} successfully confirmed decommissioning`);
        }
        catch (error) {
            console.error("Decommissioning failed at device level:", error.message);
            throw new Error(`Device failed or did not respond: ${error.message}`);
        }
        // Only now: update database (safe!)
        meter.isAssigned = false;
        meter.assignedHousehold = null;
        await this.meterRepo.save(meter);
        const log = this.logRepo.create({
            meter,
            household,
            decommissionedByUserId: dto.decommissionedBy,
            reason: dto.reason || null,
            metadata: {
                triggeredVia: "API",
                ackReceived: true,
                ackConfirmedAt: new Date().toISOString(),
                mqttRequestTopic: `apm/decommission/${dto.meterId}`,
                mqttAckTopic: "apm/decommission",
            },
        });
        const savedLog = await this.logRepo.save(log);
        // Find user for response
        const user = await this.userRepo.findOneBy({ id: dto.decommissionedBy });
        return {
            meterId: meter.meterId,
            previousHouseholdHhid: household.hhid,
            decommissionedAt: savedLog.decommissionedAt,
            logId: savedLog.id,
            reason: dto.reason || "No reason provided",
            decommissionedBy: user ? { name: user.name, email: user.email } : null,
            status: "decommissioned_and_confirmed_by_device",
        };
    }
    async getDecommissionLogs(params) {
        // ... keep your existing logic (unchanged)
        const { page, limit, meterId, hhid } = params;
        const skip = (page - 1) * limit;
        const query = this.logRepo
            .createQueryBuilder("log")
            .leftJoinAndSelect("log.meter", "meter")
            .leftJoinAndSelect("log.household", "household")
            .leftJoinAndSelect("log.decommissionedBy", "user")
            .orderBy("log.decommissionedAt", "DESC");
        if (meterId)
            query.andWhere("meter.meterId = :meterId", { meterId });
        if (hhid)
            query.andWhere("household.hhid = :hhid", { hhid });
        const [logs, total] = await query.skip(skip).take(limit).getManyAndCount();
        return {
            data: logs.map((l) => ({
                id: l.id,
                meterId: l.meter.meterId,
                householdHhid: l.household.hhid,
                reason: l.reason,
                decommissionedBy: l.decommissionedBy
                    ? {
                        id: l.decommissionedBy.id,
                        name: l.decommissionedBy.name,
                        email: l.decommissionedBy.email,
                    }
                    : null,
                decommissionedAt: l.decommissionedAt,
                ackConfirmed: !!l.metadata?.ackReceived,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.DecommissionService = DecommissionService;
//# sourceMappingURL=decommission.service.js.map