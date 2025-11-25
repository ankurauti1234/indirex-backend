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
    meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
    householdRepo = connection_1.AppDataSource.getRepository(Household_1.Household);
    logRepo = connection_1.AppDataSource.getRepository(DecommissionLog_1.DecommissionLog);
    userRepo = connection_1.AppDataSource.getRepository(User_1.User);
    async getAssignedMeters(params) {
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
        // 1. Send MQTT command
        try {
            console.log(`Sending decommission command to meter: ${dto.meterId}`);
            await (0, mqtt_client_1.publishDecommission)(dto.meterId);
            console.log(`MQTT command successfully sent for ${dto.meterId}`);
        }
        catch (mqttError) {
            console.error("CRITICAL: MQTT decommission command FAILED:", mqttError.message);
            throw new Error(`Failed to send decommission command to device: ${mqttError.message}`);
        }
        // 2. Unassign meter
        meter.isAssigned = false;
        meter.assignedHousehold = null;
        await this.meterRepo.save(meter);
        // 3. Create audit log
        const log = this.logRepo.create({
            meter,
            household,
            decommissionedByUserId: dto.decommissionedBy,
            reason: dto.reason || null,
            metadata: {
                triggeredVia: "API",
                mqttTopic: `apm/decomission/${dto.meterId}`,
                userAgent: null, // can be added later
            },
        });
        const savedLog = await this.logRepo.save(log);
        return {
            meterId: meter.meterId,
            previousHouseholdHhid: household.hhid,
            decommissionedAt: savedLog.decommissionedAt,
            logId: savedLog.id,
            reason: dto.reason || "No reason provided",
            status: "decommissioned",
        };
    }
    async getDecommissionLogs(params) {
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
