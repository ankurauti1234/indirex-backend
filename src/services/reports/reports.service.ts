// src/services/reports/reports.service.ts
import { AppDataSource } from "../../database/connection";
import { Event } from "../../database/entities/Event";
import { GeneratedHHBridgeReport } from "../../database/entities/GeneratedHhBridgeReport";
import { GeneratedHHUnbridgeReport } from "../../database/entities/GeneratedHhUnbridgeReport";
import { GeneratedHHMemberwiseBridgedReport } from "../../database/entities/GeneratedHHMemberwiseBridgedReport";
import { GeneratedHHMemberwiseUnbridgedReport } from "../../database/entities/GeneratedHHMemberwiseUnbridgedReport";
import { In } from "typeorm";
import * as csvWriter from "fast-csv";
import * as XLSX from "xlsx";
import { XMLBuilder } from "fast-xml-parser";

export interface ReportFilters {
  type?: string | number | number[];
  start_time?: string | number;
  end_time?: string | number;
  page?: number;
  limit?: number;
}

export interface PaginatedEvents {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedBridgeReports {
  reports: GeneratedHHBridgeReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedUnbridgeReports {
  reports: GeneratedHHUnbridgeReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedMemberwiseBridgeReports {
  reports: GeneratedHHMemberwiseBridgedReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedMemberwiseUnbridgeReports {
  reports: GeneratedHHMemberwiseUnbridgedReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ReportsService {
  private repo = AppDataSource.getRepository(Event);
  private bridgeRepo = AppDataSource.getRepository(GeneratedHHBridgeReport);
  private unbridgeRepo = AppDataSource.getRepository(GeneratedHHUnbridgeReport);
  private memberwiseBridgeRepo = AppDataSource.getRepository(
    GeneratedHHMemberwiseBridgedReport
  );
  private memberwiseUnbridgeRepo = AppDataSource.getRepository(
    GeneratedHHMemberwiseUnbridgedReport
  );

  private toNum(val: any): number | undefined {
    if (val === undefined || val === null || val === "") return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }

  async getReport(
    filters: ReportFilters = {},
    format: "json" | "csv" | "xlsx" | "xml" = "json"
  ): Promise<PaginatedEvents | string | Buffer> {
    const { type, start_time, end_time, page = 1, limit = 25 } = filters;

    const qb = this.repo.createQueryBuilder("event");

    // === Apply filters (same for all formats) ===
    if (type !== undefined) {
      let types: number[] = [];
      if (Array.isArray(type)) {
        types = type
          .map((t) => this.toNum(t))
          .filter((t): t is number => t !== undefined);
      } else if (typeof type === "string") {
        types = type
          .split(",")
          .map((s) => this.toNum(s.trim()))
          .filter((t): t is number => t !== undefined);
      } else {
        const n = this.toNum(type);
        if (n !== undefined) types = [n];
      }
      if (types.length) {
        qb.andWhere("event.type IN (:...types)", { types });
      }
    }

    const start = this.toNum(start_time);
    const end = this.toNum(end_time);

    if (start !== undefined && end !== undefined) {
      qb.andWhere("event.timestamp BETWEEN :start AND :end", { start, end });
    } else if (start !== undefined) {
      qb.andWhere("event.timestamp >= :start", { start });
    } else if (end !== undefined) {
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

  async getBridgeReports(
    filters: ReportFilters = {},
    format: "json" | "csv" | "xlsx" | "xml" = "json"
  ): Promise<PaginatedBridgeReports | string | Buffer> {
    const { start_time, end_time, page = 1, limit = 25 } = filters;

    const qb = this.bridgeRepo.createQueryBuilder("report");

    const start = this.toNum(start_time);
    const end = this.toNum(end_time);

    if (start !== undefined && end !== undefined) {
      qb.andWhere(
        "report.report_date BETWEEN to_timestamp(:start)::date AND to_timestamp(:end)::date",
        { start, end }
      );
    } else if (start !== undefined) {
      qb.andWhere("report.report_date >= to_timestamp(:start)::date", {
        start,
      });
    } else if (end !== undefined) {
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

  async getUnbridgeReports(
    filters: ReportFilters = {},
    format: "json" | "csv" | "xlsx" | "xml" = "json"
  ): Promise<PaginatedUnbridgeReports | string | Buffer> {
    const { start_time, end_time, page = 1, limit = 25 } = filters;

    const qb = this.unbridgeRepo.createQueryBuilder("report");

    const start = this.toNum(start_time);
    const end = this.toNum(end_time);

    if (start !== undefined && end !== undefined) {
      qb.andWhere(
        "report.report_date BETWEEN to_timestamp(:start)::date AND to_timestamp(:end)::date",
        { start, end }
      );
    } else if (start !== undefined) {
      qb.andWhere("report.report_date >= to_timestamp(:start)::date", {
        start,
      });
    } else if (end !== undefined) {
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

  private async exportEvents(
    events: Event[],
    format: "csv" | "xlsx" | "xml"
  ): Promise<string | Buffer> {
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

  private async toCSV(events: Event[]): Promise<string> {
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

  private toXLSX(events: Event[]): Buffer {
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

  private toXML(events: Event[]): string {
    const builder = new XMLBuilder({ format: true });
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

  private async exportBridgeReports(
    reports: GeneratedHHBridgeReport[],
    format: "csv" | "xlsx" | "xml"
  ): Promise<string | Buffer> {
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

  private async toBridgeCSV(
    reports: GeneratedHHBridgeReport[]
  ): Promise<string> {
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

  private toBridgeXLSX(reports: GeneratedHHBridgeReport[]): Buffer {
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

  private toBridgeXML(reports: GeneratedHHBridgeReport[]): string {
    const builder = new XMLBuilder({ format: true });
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

  private async exportUnbridgeReports(
    reports: GeneratedHHUnbridgeReport[],
    format: "csv" | "xlsx" | "xml"
  ): Promise<string | Buffer> {
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

  private async toUnbridgeCSV(
    reports: GeneratedHHUnbridgeReport[]
  ): Promise<string> {
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

  private toUnbridgeXLSX(reports: GeneratedHHUnbridgeReport[]): Buffer {
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

  private toUnbridgeXML(reports: GeneratedHHUnbridgeReport[]): string {
    const builder = new XMLBuilder({ format: true });
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

  async getMemberwiseBridgeReports(
    filters: ReportFilters = {},
    format: "json" | "csv" | "xlsx" | "xml" = "json"
  ): Promise<PaginatedMemberwiseBridgeReports | string | Buffer> {
    const { start_time, end_time, page = 1, limit = 25 } = filters;

    const qb = this.memberwiseBridgeRepo.createQueryBuilder("report");

    const start = this.toNum(start_time);
    const end = this.toNum(end_time);

    if (start !== undefined && end !== undefined) {
      qb.andWhere("report.report_date BETWEEN to_timestamp(:start)::date AND to_timestamp(:end)::date", { start, end });
    } else if (start !== undefined) {
      qb.andWhere("report.report_date >= to_timestamp(:start)::date", { start });
    } else if (end !== undefined) {
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

  async getMemberwiseUnbridgeReports(
    filters: ReportFilters = {},
    format: "json" | "csv" | "xlsx" | "xml" = "json"
  ): Promise<PaginatedMemberwiseUnbridgeReports | string | Buffer> {
    const { start_time, end_time, page = 1, limit = 25 } = filters;

    const qb = this.memberwiseUnbridgeRepo.createQueryBuilder("report");

    const start = this.toNum(start_time);
    const end = this.toNum(end_time);

    if (start !== undefined && end !== undefined) {
      qb.andWhere("report.report_date BETWEEN to_timestamp(:start)::date AND to_timestamp(:end)::date", { start, end });
    } else if (start !== undefined) {
      qb.andWhere("report.report_date >= to_timestamp(:start)::date", { start });
    } else if (end !== undefined) {
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
  private async exportMemberwiseBridgeReports(
    reports: GeneratedHHMemberwiseBridgedReport[],
    format: "csv" | "xlsx" | "xml"
  ): Promise<string | Buffer> {
    return this.exportGenericMemberwiseReports(reports, format, "MemberwiseBridge");
  }

  private async exportMemberwiseUnbridgeReports(
    reports: GeneratedHHMemberwiseUnbridgedReport[],
    format: "csv" | "xlsx" | "xml"
  ): Promise<string | Buffer> {
    return this.exportGenericMemberwiseReports(reports, format, "MemberwiseUnbridge");
  }

  private async exportGenericMemberwiseReports(
    reports: any[],
    format: "csv" | "xlsx" | "xml",
    sheetName: string
  ): Promise<string | Buffer> {
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
        const builder = new XMLBuilder({ format: true });
        return builder.build({
          reports: { report: data },
        });
      default:
        throw new Error("Unsupported format");
    }
  }
}
