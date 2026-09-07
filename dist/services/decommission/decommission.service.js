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
        if (meterId)
            qb.andWhere("meter.meterId ILIKE :meterId", { meterId: `%${meterId}%` });
        if (hhid)
            qb.andWhere("household.hhid ILIKE :hhid", { hhid: `%${hhid}%` });
        if (assigned_from)
            qb.andWhere("h.assignedAt >= :assigned_from", { assigned_from });
        if (assigned_to)
            qb.andWhere("h.assignedAt <= :assigned_to", { assigned_to });
        if (decommissioned_from)
            qb.andWhere("h.decommissionedAt >= :decommissioned_from", { decommissioned_from });
        if (decommissioned_to)
            qb.andWhere("h.decommissionedAt <= :decommissioned_to", { decommissioned_to });
        qb.orderBy("h.assignedAt", "DESC");
        const total = await qb.getCount();
        const rows = await qb.skip((page - 1) * limit).take(limit).getMany();
        const householdIds = [...new Set(rows.map((r) => r.household.id))];
        // Active meter with assigned_at
        const activeMap = new Map();
        const membersMap = new Map();
        if (householdIds.length > 0) {
            const activeRows = await this.assignmentRepo.manager.query(`SELECT a.household_id::text, m.meter_id AS meter_id_str, a.assigned_at
        FROM meter_assignments a
        INNER JOIN meters m ON m.id = a.meter_id
        WHERE a.household_id = ANY($1::uuid[])`, [householdIds]);
            for (const row of activeRows) {
                activeMap.set(row.household_id, {
                    meterId: row.meter_id_str,
                    // Apply UTC+4 offset
                    assignedAt: new Date(new Date(row.assigned_at).getTime() + 4 * 60 * 60 * 1000).toISOString(),
                });
            }
            const membersRows = await this.assignmentRepo.manager.query(`SELECT household_id::text, member_code, dob, gender
        FROM members
        WHERE household_id = ANY($1::uuid[])
        ORDER BY member_code ASC`, [householdIds]);
            for (const m of membersRows) {
                const age = new Date().getFullYear() - new Date(m.dob).getFullYear();
                const genderShort = m.gender === "Male" ? "M" : m.gender === "Female" ? "F" : m.gender;
                const entry = { code: m.member_code, age, gender: genderShort };
                const bucket = membersMap.get(m.household_id) ?? [];
                bucket.push(entry);
                membersMap.set(m.household_id, bucket);
            }
        }
        // Return is now OUTSIDE the if block — always runs
        return {
            data: rows.map((r) => {
                const active = activeMap.get(r.household.id) ?? null;
                const members = membersMap.get(r.household.id) ?? [];
                return {
                    id: String(r.id),
                    meterId: r.meter.meterId,
                    hhid: r.household.hhid,
                    householdId: r.household.id,
                    assignedAt: r.assignedAt,
                    decommissionedAt: r.decommissionedAt ?? null,
                    activeMeterId: active?.meterId ?? null,
                    activeMeterInstalledAt: active?.assignedAt ?? null,
                    members,
                };
            }),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
exports.DecommissionService = DecommissionService;
//# sourceMappingURL=decommission.service.js.map