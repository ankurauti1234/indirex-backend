"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const connection_1 = require("../../database/connection");
const Meter_1 = require("../../database/entities/Meter");
const IotMeter_1 = require("../../database/entities/IotMeter");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const xlsx_1 = __importDefault(require("xlsx"));
const stream = __importStar(require("stream"));
const typeorm_1 = require("typeorm");
const iot = new aws_sdk_1.default.Iot({ region: process.env.AWS_REGION || "ap-south-1" });
// IoT groups configured in your AWS account
const IOT_GROUPS = ["armenia_meter"];
class AssetsService {
    meterRepo = connection_1.AppDataSource.getRepository(Meter_1.Meter);
    iotMeterRepo = connection_1.AppDataSource.getRepository(IotMeter_1.IotMeter);
    // ==============================================================
    // 1️⃣ UPLOAD METERS (CSV / XLSX)
    // ==============================================================
    async uploadMeters(file, groupName, userId) {
        if (!groupName)
            throw new Error("groupName is required");
        const isCSV = file.originalname.endsWith(".csv") ||
            file.mimetype.includes("csv") ||
            file.mimetype === "text/plain";
        const isXLSX = file.originalname.endsWith(".xlsx") ||
            file.mimetype.includes("spreadsheet");
        if (!isCSV && !isXLSX) {
            throw new Error("Only CSV or XLSX files are allowed");
        }
        const results = [];
        return new Promise((resolve, reject) => {
            let parser;
            if (isCSV) {
                const readable = stream.Readable.from([file.buffer]);
                parser = readable.pipe((0, csv_parser_1.default)({
                    mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ""), // strip BOM
                }));
            }
            else {
                const workbook = xlsx_1.default.read(file.buffer, { type: "buffer" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = xlsx_1.default.utils.sheet_to_json(sheet, { defval: "" });
                const readable = new stream.Readable({
                    objectMode: true,
                    read() {
                        json.forEach((row) => this.push(row));
                        this.push(null);
                    },
                });
                parser = readable;
            }
            parser
                .on("data", (row) => {
                const meterId = String(row.meterId ||
                    row.MeterId ||
                    row.meter_id ||
                    row.MeterID ||
                    row["Meter ID"] ||
                    row["meterId"] ||
                    row["METERID"] ||
                    "").trim();
                const meterType = String(row.meterType ||
                    row.MeterType ||
                    row.meter_type ||
                    row.Meter_Type ||
                    row["Meter Type"] ||
                    row["meterType"] ||
                    "").trim();
                const assetSerialNumber = String(row.assetSerialNumber ||
                    row.AssetSerialNumber ||
                    row.asset_serial_number ||
                    row.Asset_Serial_Number ||
                    row["Asset Serial Number"] ||
                    row["assetSerialNumber"] ||
                    "").trim();
                const powerHATStatus = String(row.powerHATStatus ||
                    row.PowerHATStatus ||
                    row.power_hat_status ||
                    row.Power_HAT_Status ||
                    row["Power HAT Status"] ||
                    row["powerHATStatus"] ||
                    "").trim();
                if (meterId) {
                    const meter = {
                        meterId,
                        isAssigned: false,
                    };
                    if (meterType)
                        meter.meterType = meterType;
                    if (assetSerialNumber)
                        meter.assetSerialNumber = assetSerialNumber;
                    if (powerHATStatus)
                        meter.powerHATStatus = powerHATStatus;
                    results.push(meter);
                }
            })
                .on("end", async () => {
                try {
                    // Save new meters (ignore duplicates)
                    const meterIds = results
                        .map((r) => r.meterId)
                        .filter((id) => !!id);
                    const existing = await this.meterRepo.find({
                        where: { meterId: (0, typeorm_1.In)(meterIds) },
                    });
                    const existingSet = new Set(existing.map((e) => e.meterId));
                    const newMeters = results.filter((r) => r.meterId && !existingSet.has(r.meterId));
                    const saved = await this.meterRepo.save(newMeters, { chunk: 100 });
                    // Sync with AWS IoT
                    const synced = await this.syncIotMeters();
                    resolve({
                        uploaded: results.length,
                        saved: saved.length,
                        synced,
                    });
                }
                catch (err) {
                    reject(err);
                }
            })
                .on("error", (err) => reject(err));
        });
    }
    // ==============================================================
    // 2️⃣ LIST METERS (ENRICHED WITH AWS STATUS)
    // ==============================================================
    async getMeters(filters) {
        const page = Math.max(Number(filters.page) || 1, 1);
        const limit = Math.min(Number(filters.limit) || 10, 100);
        const skip = (page - 1) * limit;
        const [meters, total] = await this.meterRepo.findAndCount({
            order: { createdAt: "DESC" },
            take: limit,
            skip,
        });
        const iotMeters = await this.iotMeterRepo.find({
            where: { meterId: (0, typeorm_1.In)(meters.map((m) => m.meterId)) },
        });
        const iotMap = new Map(iotMeters.map((m) => [
            m.meterId,
            { groupName: m.groupName, status: m.status },
        ]));
        const enriched = meters.map((m) => ({
            meterId: m.meterId,
            assignedHouseholdId: m.assignedHouseholdId,
            isAssigned: m.isAssigned,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            groupName: iotMap.get(m.meterId)?.groupName || "unknown",
            status: iotMap.get(m.meterId)?.status || "unknown",
            meterType: m.meterType,
            assetSerialNumber: m.assetSerialNumber,
            powerHATStatus: m.powerHATStatus,
        }));
        return {
            meters: enriched,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    // ==============================================================
    // UPDATE METER
    // ==============================================================
    async updateMeter(meterId, data) {
        const meter = await this.meterRepo.findOne({ where: { meterId } });
        if (!meter)
            throw new Error("Meter not found");
        if (data.meterType !== undefined)
            meter.meterType = data.meterType;
        if (data.assetSerialNumber !== undefined)
            meter.assetSerialNumber = data.assetSerialNumber;
        if (data.powerHATStatus !== undefined)
            meter.powerHATStatus = data.powerHATStatus;
        const updatedMeter = await this.meterRepo.save(meter);
        // Enrich the updated meter (similar to getMeters)
        const iotMeter = await this.iotMeterRepo.findOne({ where: { meterId } });
        const groupName = iotMeter?.groupName || "unknown";
        const status = iotMeter?.status || "unknown";
        return {
            meterId: updatedMeter.meterId,
            assignedHouseholdId: updatedMeter.assignedHouseholdId,
            isAssigned: updatedMeter.isAssigned,
            createdAt: updatedMeter.createdAt,
            updatedAt: updatedMeter.updatedAt,
            groupName,
            status,
            meterType: updatedMeter.meterType,
            assetSerialNumber: updatedMeter.assetSerialNumber,
            powerHATStatus: updatedMeter.powerHATStatus,
        };
    }
    // ==============================================================
    // DELETE METER
    // ==============================================================
    async deleteMeter(meterId) {
        const meter = await this.meterRepo.findOne({ where: { meterId } });
        if (!meter)
            throw new Error("Meter not found");
        await this.meterRepo.remove(meter);
    }
    // ==============================================================
    // 3️⃣ LIST AWS THING GROUPS
    // ==============================================================
    async getThingGroups(filters) {
        const limit = Math.min(Number(filters.limit) || 10, 50);
        const { thingGroups = [] } = await iot
            .listThingGroups({ maxResults: limit })
            .promise();
        return {
            groups: thingGroups,
            pagination: { page: 1, limit, total: thingGroups.length, pages: 1 },
        };
    }
    // ==============================================================
    // 4️⃣ LIST THINGS IN GROUP + DB STATUS
    // ==============================================================
    async getThingsInGroup(groupName, filters) {
        const limit = Math.min(Number(filters.limit) || 10, 100);
        const { things = [] } = await iot
            .listThingsInThingGroup({ thingGroupName: groupName, maxResults: limit })
            .promise();
        const dbMeters = await this.iotMeterRepo.find({ where: { groupName } });
        const dbMap = new Map(dbMeters.map((m) => [m.meterId, m.status]));
        const thingsWithStatus = things.map((t) => ({
            thingName: t,
            status: dbMap.get(t) || "unknown",
        }));
        return {
            things: thingsWithStatus,
            pagination: { page: 1, limit, total: things.length, pages: 1 },
        };
    }
    // ==============================================================
    // 5️⃣ UNREGISTERED THINGS IN GROUP
    // ==============================================================
    async getUnregisteredInGroup(groupName) {
        const { things = [] } = await iot
            .listThingsInThingGroup({ thingGroupName: groupName })
            .promise();
        const dbMeters = await this.iotMeterRepo.find({ where: { groupName } });
        const dbSet = new Set(dbMeters.map((m) => m.meterId));
        return things.filter((name) => !dbSet.has(name));
    }
    // ==============================================================
    // 6️⃣ SYNC AWS IoT CORE → iot_meters
    // ==============================================================
    async syncIotMeters() {
        let totalSynced = 0;
        for (const group of IOT_GROUPS) {
            const { things = [] } = await iot
                .listThingsInThingGroup({ thingGroupName: group })
                .promise();
            const existing = await this.iotMeterRepo.find({
                where: { groupName: group },
            });
            const existingMap = new Map(existing.map((m) => [m.meterId, m]));
            const toSave = [];
            for (const thing of things) {
                const existing = existingMap.get(thing);
                if (existing) {
                    existing.status = IotMeter_1.IotMeterStatus.REGISTERED;
                    existing.lastSeen = new Date();
                    toSave.push(existing);
                }
                else {
                    toSave.push(this.iotMeterRepo.create({
                        meterId: thing,
                        groupName: group,
                        status: IotMeter_1.IotMeterStatus.REGISTERED,
                        lastSeen: new Date(),
                    }));
                }
                totalSynced++;
            }
            if (toSave.length > 0) {
                await this.iotMeterRepo.save(toSave, { chunk: 100 });
            }
        }
        return totalSynced;
    }
}
exports.AssetsService = AssetsService;
