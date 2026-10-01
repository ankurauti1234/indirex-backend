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
const DecommissionAttempt_1 = require("../../database/entities/DecommissionAttempt");
const mqtt_client_1 = require("../mqtt/mqtt.client");
class DecommissionService {
    constructor() {
        this.meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
        this.householdRepo = connection_1.AppDataSource.getRepository(Household_1.Household);
        this.logRepo = connection_1.AppDataSource.getRepository(DecommissionLog_1.DecommissionLog);
        this.assignmentRepo = connection_1.AppDataSource.getRepository(MeterAssignment_1.MeterAssignment);
        this.userRepo = connection_1.AppDataSource.getRepository(User_1.User);
        this.historyRepo = connection_1.AppDataSource.getRepository(HouseholdMeterHistory_1.HouseholdMeterHistory);
        this.attemptRepo = connection_1.AppDataSource.getRepository(DecommissionAttempt_1.DecommissionAttempt);
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
        const meterIds = meters.map((m) => m.id);
        /*
         * Find the latest FAILED decommission attempt for each
         * currently assigned meter + household pair whose
         * 5-minute unassign window is still active.
         */
        let eligibleAttempts = [];
        if (meterIds.length > 0) {
            eligibleAttempts = await connection_1.AppDataSource.query(`
      SELECT DISTINCT ON (da.meter_id, da.household_id)
        da.meter_id,
        da.household_id,
        da.unassign_available_until
      FROM decommission_attempts da
      INNER JOIN meters m
        ON m.id = da.meter_id
      WHERE da.meter_id = ANY($1::uuid[])
        AND da.status = 'FAILED'
        AND da.unassign_available_until IS NOT NULL
        AND da.unassign_available_until > NOW()
        AND m.is_assigned = TRUE
      ORDER BY
        da.meter_id,
        da.household_id,
        da.attempted_at DESC
      `, [meterIds]);
        }
        /*
         * Create a lookup using:
         *
         * meter UUID + household UUID
         *
         * This is deliberately NOT just meter UUID.
         */
        const unassignMap = new Map();
        for (const attempt of eligibleAttempts) {
            const key = `${attempt.meter_id}:${attempt.household_id}`;
            unassignMap.set(key, {
                unassignAvailableUntil: attempt.unassign_available_until,
            });
        }
        return {
            data: meters.map((m) => {
                const household = m.assignedHousehold;
                const key = household
                    ? `${m.id}:${household.id}`
                    : null;
                const unassignInfo = key
                    ? unassignMap.get(key)
                    : undefined;
                return {
                    id: m.id,
                    meterId: m.meterId,
                    meterType: m.meterType,
                    assetSerialNumber: m.assetSerialNumber,
                    household: household
                        ? {
                            id: household.id,
                            hhid: household.hhid,
                        }
                        : null,
                    assignedAt: m.updatedAt,
                    // New fields
                    unassignAvailable: !!unassignInfo,
                    unassignAvailableUntil: unassignInfo?.unassignAvailableUntil ?? null,
                };
            }),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async decommissionMeter(dto) {
        // 1. Find the currently assigned meter and its household
        const meter = await this.meterRepo.findOne({
            where: {
                meterId: dto.meterId,
                isAssigned: true,
            },
            relations: ["assignedHousehold"],
        });
        if (!meter || !meter.assignedHousehold) {
            throw new Error("Meter not found or not currently assigned to a household");
        }
        const household = meter.assignedHousehold;
        // 2. Create ONE decommission attempt for this user-initiated operation.
        //    MQTT may internally retry 3 times, but those are NOT separate
        //    decommission_attempts records.
        const attemptedByUser = dto.decommissionedBy
            ? await this.userRepo.findOneBy({
                id: dto.decommissionedBy,
            })
            : null;
        const attempt = this.attemptRepo.create({
            meter,
            household,
            attemptedByUser,
            status: "PENDING",
            reason: dto.reason || null,
            metadata: {
                triggeredVia: "API",
                mqttRequestTopic: `apm/decommission/${dto.meterId}`,
            },
            unassignAvailableUntil: null,
        });
        await this.attemptRepo.save(attempt);
        // 3. Send the decommission command and wait for device ACK.
        //    publishDecommissionWithAck() handles the 3 internal MQTT retries.
        try {
            console.log(`Sending decommission command and waiting for ACK: ${dto.meterId}`);
            await (0, mqtt_client_1.publishDecommissionWithAck)(dto.meterId, 30000);
            console.log(`Meter ${dto.meterId} successfully confirmed decommissioning`);
        }
        catch (error) {
            console.error("Decommissioning failed at device level:", error.message);
            // 4. All 3 internal MQTT attempts failed.
            //    Make this specific meter + household eligible for unassignment
            //    for exactly 5 minutes.
            attempt.status = "FAILED";
            attempt.unassignAvailableUntil = new Date(Date.now() + 5 * 60 * 1000);
            attempt.metadata = {
                ...attempt.metadata,
                ackReceived: false,
                failedAt: new Date().toISOString(),
                error: error.message,
            };
            await this.attemptRepo.save(attempt);
            throw new Error(`Device failed or did not respond: ${error.message}`);
        }
        // ============================================================
        // DEVICE DECOMMISSION SUCCESS
        // ============================================================
        // 5. Mark the decommission attempt as successful.
        attempt.status = "SUCCESS";
        attempt.unassignAvailableUntil = null;
        attempt.metadata = {
            ...attempt.metadata,
            ackReceived: true,
            ackConfirmedAt: new Date().toISOString(),
            mqttAckTopic: "apm/decommission",
        };
        await this.attemptRepo.save(attempt);
        // 6. Get the existing assignment BEFORE deleting it.
        //    We use meter + household so we only affect this exact pair.
        const assignment = await this.assignmentRepo.findOne({
            where: {
                meter: {
                    id: meter.id,
                },
                household: {
                    id: household.id,
                },
            },
        });
        // 7. Mark the meter as unassigned.
        meter.isAssigned = false;
        meter.assignedHousehold = null;
        await this.meterRepo.save(meter);
        // 8. Delete ONLY this meter + household assignment.
        if (assignment) {
            await this.assignmentRepo.delete({
                meter: {
                    id: meter.id,
                },
                household: {
                    id: household.id,
                },
            });
        }
        // 9. Create household-meter history.
        const decommissionedAt = new Date();
        const historyRecord = this.historyRepo.create({
            meter,
            household,
            assignedAt: assignment?.assignedAt ?? meter.updatedAt,
            decommissionedAt,
        });
        await this.historyRepo.save(historyRecord);
        // 10. Create successful decommission log.
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
        // 11. Return the object expected by the frontend.
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