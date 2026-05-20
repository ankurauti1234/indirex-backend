"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecommissionService = void 0;
// src/services/decommission/decommission.service.ts
const connection_1 = require("../../database/connection");
const Meter_1 = require("../../database/entities/Meter");
const Household_1 = require("../../database/entities/Household");
const DecommissionLog_1 = require("../../database/entities/DecommissionLog");
const MeterAssignment_1 = require("../../database/entities/MeterAssignment");
const User_1 = require("../../database/entities/User");
const HouseholdMeterHistory_1 = require("../../database/entities/HouseholdMeterHistory");
const mqtt_client_1 = require("../mqtt/mqtt.client");
class DecommissionService {
    constructor() {
        this.meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
        this.householdRepo = connection_1.AppDataSource.getRepository(Household_1.Household);
        this.logRepo = connection_1.AppDataSource.getRepository(DecommissionLog_1.DecommissionLog);
        this.assignmentRepo = connection_1.AppDataSource.getRepository(MeterAssignment_1.MeterAssignment);
        this.userRepo = connection_1.AppDataSource.getRepository(User_1.User);
        this.historyRepo = connection_1.AppDataSource.getRepository(HouseholdMeterHistory_1.HouseholdMeterHistory);
    }
    // Returns a flat list of all currently active hhid->meterId assignments
    async getActiveAssignments() {
        const meters = await this.meterRepo.find({
            where: { isAssigned: true },
            relations: ["assignedHousehold"],
        });
        return meters
            .filter((m) => m.assignedHousehold?.hhid && m.meterId)
            .map((m) => ({ hhid: m.assignedHousehold.hhid, meterId: m.meterId }));
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
        // Capture assignedAt from the assignment before deleting it
        const assignment = await this.assignmentRepo.findOne({
            where: { meter: { id: meter.id } },
        });
        // ALSO DELETE FROM METER_ASSIGNMENTS (To fix household status issue)
        await this.assignmentRepo.delete({ meter: { id: meter.id } });
        // Write to household_meter_history: assignedAt from assignment, decommissionedAt = now
        const decommissionedAt = new Date();
        const historyRecord = this.historyRepo.create({
            meter,
            household,
            assignedAt: assignment?.assignedAt ?? meter.updatedAt,
            decommissionedAt,
        });
        await this.historyRepo.save(historyRecord);
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
    async getHouseholdMeterHistory(params) {
        const { page, limit, meterId, hhid, assigned_from, assigned_to, decommissioned_from, decommissioned_to } = params;
        const qb = this.historyRepo
            .createQueryBuilder("h")
            .leftJoinAndSelect("h.meter", "meter")
            .leftJoinAndSelect("h.household", "household");
        if (meterId) {
            qb.andWhere("meter.meterId ILIKE :meterId", { meterId: `%${meterId}%` });
        }
        if (hhid) {
            qb.andWhere("household.hhid ILIKE :hhid", { hhid: `%${hhid}%` });
        }
        if (assigned_from) {
            qb.andWhere("h.assignedAt >= :assigned_from", { assigned_from });
        }
        if (assigned_to) {
            qb.andWhere("h.assignedAt <= :assigned_to", { assigned_to });
        }
        if (decommissioned_from) {
            qb.andWhere("h.decommissionedAt >= :decommissioned_from", { decommissioned_from });
        }
        if (decommissioned_to) {
            qb.andWhere("h.decommissionedAt <= :decommissioned_to", { decommissioned_to });
        }
        qb.orderBy("h.assignedAt", "DESC");
        const total = await qb.getCount();
        const rows = await qb.skip((page - 1) * limit).take(limit).getMany();
        // Get unique household UUIDs from this page
        const householdIds = [...new Set(rows.map((r) => r.household.id))];
        // Raw query: join meter_assignments with meters to get active meter_id string per household
        const activeMap = new Map(); // household_id (uuid) -> meterId (string)
        if (householdIds.length > 0) {
            const activeRows = await this.assignmentRepo.manager.query(`SELECT a.household_id::text, m.meter_id AS meter_id_str
           FROM meter_assignments a
           INNER JOIN meters m ON m.id = a.meter_id
           WHERE a.household_id = ANY($1::uuid[])`, [householdIds]);
            for (const row of activeRows) {
                activeMap.set(row.household_id, row.meter_id_str);
            }
        }
        return {
            data: rows.map((r) => ({
                id: String(r.id),
                meterId: r.meter.meterId,
                hhid: r.household.hhid,
                assignedAt: r.assignedAt,
                decommissionedAt: r.decommissionedAt ?? null,
                activeMeterId: activeMap.get(r.household.id) ?? null,
            })),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
exports.DecommissionService = DecommissionService;
//# sourceMappingURL=decommission.service.js.map