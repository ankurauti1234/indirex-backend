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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
// src/services/reports/reports.service.ts
const connection_1 = require("../../database/connection");
const Event_1 = require("../../database/entities/Event");
const csvWriter = __importStar(require("fast-csv"));
const XLSX = __importStar(require("xlsx"));
const fast_xml_parser_1 = require("fast-xml-parser");
class ReportsService {
    constructor() {
        this.repo = connection_1.AppDataSource.getRepository(Event_1.Event);
    }
    toNum(val) {
        if (val === undefined || val === null || val === "")
            return undefined;
        const n = Number(val);
        return isNaN(n) ? undefined : n;
    }
    async getReport(filters = {}, format = "json") {
        const { type, start_time, end_time, page = 1, limit = 25 } = filters;
        const qb = this.repo.createQueryBuilder("event");
        // === Apply filters (same for all formats) ===
        if (type !== undefined) {
            let types = [];
            if (Array.isArray(type)) {
                types = type.map((t) => this.toNum(t)).filter((t) => t !== undefined);
            }
            else if (typeof type === "string") {
                types = type
                    .split(",")
                    .map((s) => this.toNum(s.trim()))
                    .filter((t) => t !== undefined);
            }
            else {
                const n = this.toNum(type);
                if (n !== undefined)
                    types = [n];
            }
            if (types.length) {
                qb.andWhere("event.type IN (:...types)", { types });
            }
        }
        const start = this.toNum(start_time);
        const end = this.toNum(end_time);
        if (start !== undefined && end !== undefined) {
            qb.andWhere("event.timestamp BETWEEN :start AND :end", { start, end });
        }
        else if (start !== undefined) {
            qb.andWhere("event.timestamp >= :start", { start });
        }
        else if (end !== undefined) {
            qb.andWhere("event.timestamp <= :end", { end });
        }
        qb.orderBy("event.timestamp", "DESC");
        // === JSON: Use pagination ===
        if (format === "json") {
            const take = Math.min(limit || 25, 100);
            const skip = (page - 1) * take;
            qb.take(take).skip(skip);
            const [events, total] = await qb.getManyAndCount();
            return {
                events,
                pagination: {
                    page,
                    limit: take,
                    total,
                    pages: Math.ceil(total / take),
                },
            };
        }
        // === CSV / XLSX / XML: Get ALL events (no pagination) ===
        const allEvents = await qb.getMany();
        return await this.exportEvents(allEvents, format);
    }
    async exportEvents(events, format) {
        switch (format) {
            case "csv":
                return await this.toCSV(events);
            case "xlsx":
                return this.toXLSX(events);
            case "xml":
                return this.toXML(events);
            default:
                throw new Error("Unsupported format");
        }
    }
    async toCSV(events) {
        return new Promise((resolve, reject) => {
            const csvStream = csvWriter.format({ headers: true });
            const rows = events.map((e) => ({
                id: e.id,
                meterId: e.device_id,
                timestamp: new Date(e.timestamp * 1000).toISOString(),
                type: e.type,
                details: JSON.stringify(e.details),
            }));
            let csv = "";
            csvStream.on("data", (chunk) => (csv += chunk.toString()));
            csvStream.on("end", () => resolve(csv));
            csvStream.on("error", reject);
            rows.forEach((row) => csvStream.write(row));
            csvStream.end();
        });
    }
    toXLSX(events) {
        const data = events.map((e) => ({
            id: e.id,
            meterId: e.device_id,
            timestamp: new Date(e.timestamp * 1000).toISOString(),
            type: e.type,
            details: JSON.stringify(e.details),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Events");
        return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    }
    toXML(events) {
        const builder = new fast_xml_parser_1.XMLBuilder({ format: true });
        const root = {
            events: {
                event: events.map((e) => ({
                    id: e.id,
                    meterId: e.device_id,
                    timestamp: new Date(e.timestamp * 1000).toISOString(),
                    type: e.type,
                    details: JSON.stringify(e.details),
                })),
            },
        };
        return builder.build(root);
    }
}
exports.ReportsService = ReportsService;
//# sourceMappingURL=reports.service.js.map