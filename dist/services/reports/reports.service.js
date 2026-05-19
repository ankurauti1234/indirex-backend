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
const GeneratedHhBridgeReport_1 = require("../../database/entities/GeneratedHhBridgeReport");
const GeneratedHhUnbridgeReport_1 = require("../../database/entities/GeneratedHhUnbridgeReport");
const GeneratedHHMemberwiseBridgedReport_1 = require("../../database/entities/GeneratedHHMemberwiseBridgedReport");
const GeneratedHHMemberwiseUnbridgedReport_1 = require("../../database/entities/GeneratedHHMemberwiseUnbridgedReport");
const csvWriter = __importStar(require("fast-csv"));
const XLSX = __importStar(require("xlsx"));
const fast_xml_parser_1 = require("fast-xml-parser");
const LogoDailyViewershipCSV_1 = require("../../database/entities/LogoDailyViewershipCSV");
class ReportsService {
    constructor() {
        this.repo = connection_1.AppDataSource.getRepository(Event_1.Event);
        this.bridgeRepo = connection_1.AppDataSource.getRepository(GeneratedHhBridgeReport_1.GeneratedHHBridgeReport);
        this.unbridgeRepo = connection_1.AppDataSource.getRepository(GeneratedHhUnbridgeReport_1.GeneratedHHUnbridgeReport);
        this.memberwiseBridgeRepo = connection_1.AppDataSource.getRepository(GeneratedHHMemberwiseBridgedReport_1.GeneratedHHMemberwiseBridgedReport);
        this.memberwiseUnbridgeRepo = connection_1.AppDataSource.getRepository(GeneratedHHMemberwiseUnbridgedReport_1.GeneratedHHMemberwiseUnbridgedReport);
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
                types = type
                    .map((t) => this.toNum(t))
                    .filter((t) => t !== undefined);
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
    async getBridgeReports(filters = {}, format = "json") {
        const { start_time, end_time, page = 1, limit = 25 } = filters;
        const qb = this.bridgeRepo.createQueryBuilder("report");
        const start = this.toNum(start_time);
        const end = this.toNum(end_time);
        if (start !== undefined && end !== undefined) {
            qb.andWhere("report.report_date BETWEEN to_timestamp(:start)::date AND to_timestamp(:end)::date", { start, end });
        }
        else if (start !== undefined) {
            qb.andWhere("report.report_date >= to_timestamp(:start)::date", {
                start,
            });
        }
        else if (end !== undefined) {
            qb.andWhere("report.report_date <= to_timestamp(:end)::date", { end });
        }
        qb.orderBy("report.report_date", "DESC");
        if (format === "json") {
            const take = Math.min(limit || 25, 100);
            const skip = (page - 1) * take;
            qb.take(take).skip(skip);
            const [reports, total] = await qb.getManyAndCount();
            return {
                reports,
                pagination: {
                    page,
                    limit: take,
                    total,
                    pages: Math.ceil(total / take),
                },
            };
        }
        const allReports = await qb.getMany();
        return await this.exportBridgeReports(allReports, format);
    }
    async getUnbridgeReports(filters = {}, format = "json") {
        const { start_time, end_time, page = 1, limit = 25 } = filters;
        const qb = this.unbridgeRepo.createQueryBuilder("report");
        const start = this.toNum(start_time);
        const end = this.toNum(end_time);
        if (start !== undefined && end !== undefined) {
            qb.andWhere("report.report_date BETWEEN to_timestamp(:start)::date AND to_timestamp(:end)::date", { start, end });
        }
        else if (start !== undefined) {
            qb.andWhere("report.report_date >= to_timestamp(:start)::date", {
                start,
            });
        }
        else if (end !== undefined) {
            qb.andWhere("report.report_date <= to_timestamp(:end)::date", { end });
        }
        qb.orderBy("report.report_date", "DESC");
        if (format === "json") {
            const take = Math.min(limit || 25, 100);
            const skip = (page - 1) * take;
            qb.take(take).skip(skip);
            const [reports, total] = await qb.getManyAndCount();
            return {
                reports,
                pagination: {
                    page,
                    limit: take,
                    total,
                    pages: Math.ceil(total / take),
                },
            };
        }
        const allReports = await qb.getMany();
        return await this.exportUnbridgeReports(allReports, format);
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
    async exportBridgeReports(reports, format) {
        switch (format) {
            case "csv":
                return await this.toBridgeCSV(reports);
            case "xlsx":
                return this.toBridgeXLSX(reports);
            case "xml":
                return this.toBridgeXML(reports);
            default:
                throw new Error("Unsupported format");
        }
    }
    async toBridgeCSV(reports) {
        return new Promise((resolve, reject) => {
            const csvStream = csvWriter.format({ headers: true });
            const rows = reports.map((r) => ({
                id: r.id,
                generation_time: r.generation_time.toISOString(),
                report_date: r.report_date.toISOString(),
                report_url: r.report_url,
                session_count: r.session_count,
            }));
            let csv = "";
            csvStream.on("data", (chunk) => (csv += chunk.toString()));
            csvStream.on("end", () => resolve(csv));
            csvStream.on("error", reject);
            rows.forEach((row) => csvStream.write(row));
            csvStream.end();
        });
    }
    toBridgeXLSX(reports) {
        const data = reports.map((r) => ({
            id: r.id,
            generation_time: r.generation_time.toISOString(),
            report_date: r.report_date.toISOString(),
            report_url: r.report_url,
            session_count: r.session_count,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BridgeReports");
        return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    }
    toBridgeXML(reports) {
        const builder = new fast_xml_parser_1.XMLBuilder({ format: true });
        const root = {
            reports: {
                report: reports.map((r) => ({
                    id: r.id,
                    generation_time: r.generation_time.toISOString(),
                    report_date: r.report_date.toISOString(),
                    report_url: r.report_url,
                    session_count: r.session_count,
                })),
            },
        };
        return builder.build(root);
    }
    async exportUnbridgeReports(reports, format) {
        switch (format) {
            case "csv":
                return await this.toUnbridgeCSV(reports);
            case "xlsx":
                return this.toUnbridgeXLSX(reports);
            case "xml":
                return this.toUnbridgeXML(reports);
            default:
                throw new Error("Unsupported format");
        }
    }
    async toUnbridgeCSV(reports) {
        return new Promise((resolve, reject) => {
            const csvStream = csvWriter.format({ headers: true });
            const rows = reports.map((r) => ({
                id: r.id,
                generation_time: r.generation_time.toISOString(),
                report_date: r.report_date.toISOString(),
                report_url: r.report_url,
                session_count: r.session_count,
            }));
            let csv = "";
            csvStream.on("data", (chunk) => (csv += chunk.toString()));
            csvStream.on("end", () => resolve(csv));
            csvStream.on("error", reject);
            rows.forEach((row) => csvStream.write(row));
            csvStream.end();
        });
    }
    toUnbridgeXLSX(reports) {
        const data = reports.map((r) => ({
            id: r.id,
            generation_time: r.generation_time.toISOString(),
            report_date: r.report_date.toISOString(),
            report_url: r.report_url,
            session_count: r.session_count,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "UnbridgeReports");
        return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    }
    toUnbridgeXML(reports) {
        const builder = new fast_xml_parser_1.XMLBuilder({ format: true });
        const root = {
            reports: {
                report: reports.map((r) => ({
                    id: r.id,
                    generation_time: r.generation_time.toISOString(),
                    report_date: r.report_date.toISOString(),
                    report_url: r.report_url,
                    session_count: r.session_count,
                })),
            },
        };
        return builder.build(root);
    }
    async getMemberwiseBridgeReports(filters = {}, format = "json") {
        const { start_time, end_time, page = 1, limit = 25 } = filters;
        const qb = this.memberwiseBridgeRepo.createQueryBuilder("report");
        const start = this.toNum(start_time);
        const end = this.toNum(end_time);
        if (start !== undefined && end !== undefined) {
            qb.andWhere("report.report_date BETWEEN to_timestamp(:start)::date AND to_timestamp(:end)::date", { start, end });
        }
        else if (start !== undefined) {
            qb.andWhere("report.report_date >= to_timestamp(:start)::date", { start });
        }
        else if (end !== undefined) {
            qb.andWhere("report.report_date <= to_timestamp(:end)::date", { end });
        }
        qb.orderBy("report.report_date", "DESC");
        if (format === "json") {
            const take = Math.min(limit || 25, 100);
            const skip = (page - 1) * take;
            qb.take(take).skip(skip);
            const [reports, total] = await qb.getManyAndCount();
            return {
                reports,
                pagination: {
                    page,
                    limit: take,
                    total,
                    pages: Math.ceil(total / take),
                },
            };
        }
        const allReports = await qb.getMany();
        return await this.exportMemberwiseBridgeReports(allReports, format);
    }
    async getMemberwiseUnbridgeReports(filters = {}, format = "json") {
        const { start_time, end_time, page = 1, limit = 25 } = filters;
        const qb = this.memberwiseUnbridgeRepo.createQueryBuilder("report");
        const start = this.toNum(start_time);
        const end = this.toNum(end_time);
        if (start !== undefined && end !== undefined) {
            qb.andWhere("report.report_date BETWEEN to_timestamp(:start)::date AND to_timestamp(:end)::date", { start, end });
        }
        else if (start !== undefined) {
            qb.andWhere("report.report_date >= to_timestamp(:start)::date", { start });
        }
        else if (end !== undefined) {
            qb.andWhere("report.report_date <= to_timestamp(:end)::date", { end });
        }
        qb.orderBy("report.report_date", "DESC");
        if (format === "json") {
            const take = Math.min(limit || 25, 100);
            const skip = (page - 1) * take;
            qb.take(take).skip(skip);
            const [reports, total] = await qb.getManyAndCount();
            return {
                reports,
                pagination: {
                    page,
                    limit: take,
                    total,
                    pages: Math.ceil(total / take),
                },
            };
        }
        const allReports = await qb.getMany();
        return await this.exportMemberwiseUnbridgeReports(allReports, format);
    }
    // Export helpers
    async exportMemberwiseBridgeReports(reports, format) {
        return this.exportGenericMemberwiseReports(reports, format, "MemberwiseBridge");
    }
    async exportMemberwiseUnbridgeReports(reports, format) {
        return this.exportGenericMemberwiseReports(reports, format, "MemberwiseUnbridge");
    }
    async exportGenericMemberwiseReports(reports, format, sheetName) {
        const data = reports.map((r) => ({
            id: r.id,
            generation_time: r.generation_time.toISOString(),
            report_date: r.report_date.toISOString().split("T")[0],
            report_url: r.report_url,
            session_count: r.session_count,
        }));
        switch (format) {
            case "csv":
                return new Promise((resolve, reject) => {
                    const csvStream = csvWriter.format({ headers: true });
                    let csv = "";
                    csvStream.on("data", (chunk) => (csv += chunk));
                    csvStream.on("end", () => resolve(csv));
                    csvStream.on("error", reject);
                    data.forEach((row) => csvStream.write(row));
                    csvStream.end();
                });
            case "xlsx":
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
                return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
            case "xml":
                const builder = new fast_xml_parser_1.XMLBuilder({ format: true });
                return builder.build({
                    reports: { report: data },
                });
            default:
                throw new Error("Unsupported format");
        }
    }
    // ─── Viewership CSV Reports ───────────────────────────────────────────────────
    async getViewershipCSVReports(filters) {
        const { date_label, month, page = 1, limit = 31 } = filters;
        const repo = connection_1.AppDataSource.getRepository(LogoDailyViewershipCSV_1.LogoDailyViewershipCSV);
        const qb = repo.createQueryBuilder("v");
        if (date_label) {
            qb.andWhere("v.date_label = :date_label", { date_label });
        }
        // month is "MM-YYYY"; date_label format is "DD-MM-YYYY", so match the suffix
        if (month) {
            qb.andWhere("v.date_label LIKE :month", { month: `%-${month}` });
        }
        qb.orderBy("v.createdAt", "DESC");
        const total = await qb.getCount();
        const reports = await qb.skip((page - 1) * limit).take(limit).getMany();
        return {
            reports,
            pagination: {
                page, limit, total, totalPages: Math.ceil(total / limit),
                pages: 0
            },
        };
    }
}
exports.ReportsService = ReportsService;
//# sourceMappingURL=reports.service.js.map