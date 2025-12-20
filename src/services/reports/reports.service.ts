// src/services/reports/reports.service.ts
import { AppDataSource } from "../../database/connection";
import { Event } from "../../database/entities/Event";
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

export class ReportsService {
  private repo = AppDataSource.getRepository(Event);

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
        types = type.map((t) => this.toNum(t)).filter((t): t is number => t !== undefined);
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
}