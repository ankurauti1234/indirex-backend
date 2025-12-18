import { AppDataSource } from "../../database/connection";
import { Meter } from "../../database/entities/Meter";
import { IotMeter, IotMeterStatus } from "../../database/entities/IotMeter";
import AWS from "aws-sdk";
import csv from "csv-parser";
import XLSX from "xlsx";
import * as stream from "stream";
import { In } from "typeorm";
import { env } from "../../config/env";

const iot = new AWS.Iot({ region: env.aws.region || "ap-south-1" });

// IoT groups configured in your AWS account
const IOT_GROUPS = ["armenia_meter"];

export interface MeterFilters {
  page: number;
  limit: number;
  meterId?: string;
  status?: IotMeterStatus;
  powerHATStatus?: string;
  groupName?: string;
  meterType?: string;
}


export interface EnrichedMeter {
  meterId: string;
  assignedHouseholdId?: string | null;
  isAssigned: boolean;
  createdAt: Date;
  updatedAt: Date;
  groupName: string;
  status: IotMeterStatus | "unknown";
  meterType?: string | null;
  assetSerialNumber?: string | null;
  powerHATStatus?: string | null;
}

export class AssetsService {
  private meterRepo = AppDataSource.getRepository(Meter);
  private iotMeterRepo = AppDataSource.getRepository(IotMeter);

  // ==============================================================
  // 1️⃣ UPLOAD METERS (CSV / XLSX)
  // ==============================================================
  async uploadMeters(
    file: Express.Multer.File,
    groupName: string,
    userId: string
  ): Promise<{ uploaded: number; saved: number; synced: number }> {
    if (!groupName) throw new Error("groupName is required");

    const isCSV =
      file.originalname.endsWith(".csv") ||
      file.mimetype.includes("csv") ||
      file.mimetype === "text/plain";
    const isXLSX =
      file.originalname.endsWith(".xlsx") ||
      file.mimetype.includes("spreadsheet");

    if (!isCSV && !isXLSX) {
      throw new Error("Only CSV or XLSX files are allowed");
    }

    const results: Partial<Meter>[] = [];

    return new Promise((resolve, reject) => {
      let parser: stream.Readable;

      if (isCSV) {
        const readable = stream.Readable.from([file.buffer]);
        parser = readable.pipe(
          csv({
            mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ""), // strip BOM
          })
        );
      } else {
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
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
        .on("data", (row: any) => {
          const meterId = String(
            row.meterId ||
              row.MeterId ||
              row.meter_id ||
              row.MeterID ||
              row["Meter ID"] ||
              row["meterId"] ||
              row["METERID"] ||
              ""
          ).trim();

          const meterType = String(
            row.meterType ||
              row.MeterType ||
              row.meter_type ||
              row.Meter_Type ||
              row["Meter Type"] ||
              row["meterType"] ||
              ""
          ).trim();

          const assetSerialNumber = String(
            row.assetSerialNumber ||
              row.AssetSerialNumber ||
              row.asset_serial_number ||
              row.Asset_Serial_Number ||
              row["Asset Serial Number"] ||
              row["assetSerialNumber"] ||
              ""
          ).trim();

          const powerHATStatus = String(
            row.powerHATStatus ||
              row.PowerHATStatus ||
              row.power_hat_status ||
              row.Power_HAT_Status ||
              row["Power HAT Status"] ||
              row["powerHATStatus"] ||
              ""
          ).trim();

          if (meterId) {
            const meter: Partial<Meter> = {
              meterId,
              isAssigned: false,
            };
            if (meterType) meter.meterType = meterType;
            if (assetSerialNumber) meter.assetSerialNumber = assetSerialNumber;
            if (powerHATStatus) meter.powerHATStatus = powerHATStatus;
            results.push(meter);
          }
        })
        .on("end", async () => {
          try {
            // Save new meters (ignore duplicates)
            const meterIds = results
              .map((r) => r.meterId)
              .filter((id): id is string => !!id);
            const existing = await this.meterRepo.find({
              where: { meterId: In(meterIds) },
            });
            const existingSet = new Set(existing.map((e) => e.meterId));

            const newMeters = results.filter(
              (r) => r.meterId && !existingSet.has(r.meterId)
            );

            const saved = await this.meterRepo.save(newMeters, { chunk: 100 });

            // Sync with AWS IoT
            const synced = await this.syncIotMeters();

            resolve({
              uploaded: results.length,
              saved: saved.length,
              synced,
            });
          } catch (err) {
            reject(err);
          }
        })
        .on("error", (err) => reject(err));
    });
  }

  // ==============================================================
  // 2️⃣ LIST METERS (ENRICHED WITH AWS STATUS)
  // ==============================================================
  async getMeters(filters: MeterFilters) {
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Number(filters.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const qb = this.meterRepo.createQueryBuilder("meter");

    // 🔹 meterId filter
    if (filters.meterId) {
      qb.andWhere("meter.meterId ILIKE :meterId", {
        meterId: `%${filters.meterId}%`,
      });
    }

    // 🔹 power HAT filter
    if (filters.powerHATStatus) {
      qb.andWhere("meter.powerHATStatus = :powerHATStatus", {
        powerHATStatus: filters.powerHATStatus,
      });
    }

    // 🔹 meterType filter
    if (filters.meterType) {
      qb.andWhere("meter.meterType = :meterType", {
        meterType: filters.meterType,
      });
    }

    // 🔹 join iot_meters only if needed
    if (filters.status || filters.groupName) {
      qb.leftJoin(IotMeter, "iot", "iot.meterId = meter.meterId");

      if (filters.status) {
        qb.andWhere("iot.status = :status", { status: filters.status });
      }

      if (filters.groupName) {
        qb.andWhere("iot.groupName = :groupName", {
          groupName: filters.groupName,
        });
      }
    }

    qb.orderBy("meter.createdAt", "DESC").skip(skip).take(limit);

    const [meters, total] = await qb.getManyAndCount();

    const iotMeters = await this.iotMeterRepo.find({
      where: { meterId: In(meters.map((m) => m.meterId)) },
    });

    const iotMap = new Map(
      iotMeters.map((m) => [
        m.meterId,
        { groupName: m.groupName, status: m.status },
      ])
    );

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
  async updateMeter(
    meterId: string,
    data: {
      meterType?: string;
      assetSerialNumber?: string;
      powerHATStatus?: string;
    }
  ): Promise<EnrichedMeter> {
    const meter = await this.meterRepo.findOne({ where: { meterId } });
    if (!meter) throw new Error("Meter not found");

    if (data.meterType !== undefined) meter.meterType = data.meterType;
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
  async deleteMeter(meterId: string): Promise<void> {
    const meter = await this.meterRepo.findOne({ where: { meterId } });
    if (!meter) throw new Error("Meter not found");
    await this.meterRepo.remove(meter);
  }

  // ==============================================================
  // 3️⃣ LIST AWS THING GROUPS
  // ==============================================================
  async getThingGroups(filters: { page: number; limit: number }) {
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
  async getThingsInGroup(
    groupName: string,
    filters: { page: number; limit: number }
  ) {
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
  async getUnregisteredInGroup(groupName: string): Promise<string[]> {
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
  async syncIotMeters(): Promise<number> {
    let totalSynced = 0;

    for (const group of IOT_GROUPS) {
      const { things = [] } = await iot
        .listThingsInThingGroup({ thingGroupName: group })
        .promise();

      const existing = await this.iotMeterRepo.find({
        where: { groupName: group },
      });
      const existingMap = new Map(existing.map((m) => [m.meterId, m]));

      const toSave: IotMeter[] = [];

      for (const thing of things) {
        const existing = existingMap.get(thing);
        if (existing) {
          existing.status = IotMeterStatus.REGISTERED;
          existing.lastSeen = new Date();
          toSave.push(existing);
        } else {
          toSave.push(
            this.iotMeterRepo.create({
              meterId: thing,
              groupName: group,
              status: IotMeterStatus.REGISTERED,
              lastSeen: new Date(),
            })
          );
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