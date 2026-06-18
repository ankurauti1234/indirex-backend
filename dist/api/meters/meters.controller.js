"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unassignMeter = exports.getInstalledMeters = exports.getMeterStats = void 0;
const connection_1 = require("../../database/connection");
const Meter_1 = require("../../database/entities/Meter");
const response_1 = require("../../utils/response");
// Reusable range condition for IM000101 – IM000600
const IM_RANGE_CONDITION = `
  meter.meterId LIKE 'IM%'
  AND CAST(SUBSTRING(meter.meterId FROM 3) AS INTEGER) BETWEEN :minNum AND :maxNum
`;
const IM_RANGE_PARAMS = { minNum: 101, maxNum: 600 };
// GET /api/v1/meters/stats
const getMeterStats = async (req, res) => {
    try {
        const meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
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
        (0, response_1.sendSuccess)(res, {
            totalInstalled,
            totalMeters,
            totalUninstalled: totalMeters - totalInstalled,
        }, "Meter stats fetched");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getMeterStats = getMeterStats;
// GET /api/v1/meters/installed
const getInstalledMeters = async (req, res) => {
    try {
        const meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
        const page = Math.max(1, Number(req.query.page) || 1);
        const isExport = req.query.export === "true";
        const limit = isExport ? 999999 : Math.min(100, Math.max(1, Number(req.query.limit) || 25));
        const search = req.query.search || "";
        const dateFrom = req.query.dateFrom || "";
        const dateTo = req.query.dateTo || "";
        const skip = (page - 1) * limit;
        const qb = meterRepo
            .createQueryBuilder("meter")
            .leftJoinAndSelect("meter.assignedHousehold", "household")
            .leftJoinAndSelect("meter.assignments", "assignment")
            .where("meter.isAssigned = :isAssigned", { isAssigned: true })
            .andWhere(IM_RANGE_CONDITION, IM_RANGE_PARAMS);
        if (search) {
            qb.andWhere("(meter.meterId ILIKE :search OR household.hhid ILIKE :search)", { search: `%${search}%` });
        }
        if (dateFrom) {
            qb.andWhere("assignment.assignedAt >= :dateFrom", {
                dateFrom: new Date(dateFrom + "T00:00:00.000Z"),
            });
        }
        if (dateTo) {
            qb.andWhere("assignment.assignedAt <= :dateTo", {
                dateTo: new Date(dateTo + "T23:59:59.999Z"),
            });
        }
        const [meters, total] = await qb
            .orderBy("assignment.assignedAt", "DESC")
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const result = meters.map((m) => {
            // Pick the most recent assignment's assignedAt as the installed date
            const latestAssignment = m.assignments
                ?.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())[0];
            return {
                meterId: m.meterId,
                assignedHouseholdId: m.assignedHousehold?.hhid ?? null,
                meterType: m.meterType ?? null,
                assetSerialNumber: m.assetSerialNumber ?? null,
                installedAt: latestAssignment?.assignedAt ?? m.updatedAt,
            };
        });
        (0, response_1.sendSuccess)(res, {
            meters: result,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        }, "Installed meters fetched");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 500);
    }
};
exports.getInstalledMeters = getInstalledMeters;
const unassignMeter = async (req, res) => {
    const { hhid, meterId } = req.body;
    if (!hhid || !meterId) {
        return res.status(400).json({
            success: false,
            error: "Both HHID and Meter ID are required.",
        });
    }
    const queryRunner = connection_1.AppDataSource.createQueryRunner();
    await queryRunner.connect();
    try {
        // 1. Resolve household UUID
        const household = await queryRunner.query(`SELECT id FROM households WHERE hhid = $1`, [hhid]);
        if (household.length === 0) {
            await queryRunner.release();
            return res.status(404).json({
                success: false,
                error: `Household with HHID "${hhid}" not found.`,
            });
        }
        const householdId = household[0].id;
        // 2. Resolve meter UUID
        const meter = await queryRunner.query(`SELECT id FROM meters WHERE meter_id = $1`, [meterId]);
        if (meter.length === 0) {
            await queryRunner.release();
            return res.status(404).json({
                success: false,
                error: `Meter with Meter ID "${meterId}" not found.`,
            });
        }
        const meterUuid = meter[0].id;
        // 3. Atomic transaction
        await queryRunner.startTransaction();
        try {
            const assignment = await queryRunner.query(`SELECT assigned_at FROM meter_assignments WHERE meter_id = $1 AND household_id = $2`, [meterUuid, householdId]);
            const assignedAt = assignment[0]?.assigned_at ?? null;
            await queryRunner.query(`DELETE FROM meter_assignments WHERE meter_id = $1 AND household_id = $2`, [meterUuid, householdId]);
            await queryRunner.query(`UPDATE meters SET assigned_household_id = NULL, is_assigned = FALSE, updated_at = NOW() WHERE id = $1`, [meterUuid]);
            await queryRunner.query(`INSERT INTO household_meter_history (household_id, meter_id, assigned_at, decommissioned_at)
         VALUES ($1, $2, COALESCE($3, NOW()), NOW())`, [householdId, meterUuid, assignedAt]);
            await queryRunner.commitTransaction();
        }
        catch (txErr) {
            await queryRunner.rollbackTransaction();
            throw txErr;
        }
        // 4. Return updated meter state
        const verify = await queryRunner.query(`SELECT meter_id, assigned_household_id, is_assigned, updated_at FROM meters WHERE meter_id = $1`, [meterId]);
        const updatedMeter = verify[0];
        await queryRunner.release();
        return res.json({
            success: true,
            message: `Meter ${meterId} successfully unassigned from household ${hhid} and history recorded.`,
            meter: {
                meterId: updatedMeter.meter_id,
                assignedHouseholdId: updatedMeter.assigned_household_id,
                isAssigned: updatedMeter.is_assigned,
                updatedAt: updatedMeter.updated_at,
            },
        });
    }
    catch (err) {
        if (!queryRunner.isReleased)
            await queryRunner.release();
        console.error("unassignMeter error:", err);
        const message = err instanceof Error ? err.message : "An unexpected database error occurred.";
        return res.status(500).json({ success: false, error: message });
    }
};
exports.unassignMeter = unassignMeter;
//# sourceMappingURL=meters.controller.js.map