// src/services/events/event.service.ts
import { EventFilters, PaginatedEvents } from "../../api/events/events.types";
import { AppDataSource } from "../../database/connection";
import { Event } from "../../database/entities/Event";
import { EventMappingService } from "./event-mapping.service";
import { Between } from "typeorm";

const mappingService = new EventMappingService();

export class EventService {
  private repo = AppDataSource.getRepository(Event);

  private toNum(val: any): number | undefined {
    if (val === undefined || val === null || val === "") return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }
 
  async getEvents(filters: EventFilters = {}): Promise<PaginatedEvents> {
    const {
      device_id,
      type,
      start_time,
      end_time,
      page = 1,
      limit = 10,
    } = filters;

    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const qb = this.repo.createQueryBuilder("event");

    if (device_id) qb.andWhere("event.device_id = :device_id", { device_id });

    if (type !== undefined) {
      let types: number[] = [];
      if (Array.isArray(type)) {
        types = type.map(t => this.toNum(t)).filter((t): t is number => t !== undefined);
      } else if (typeof type === "string") {
        types = type
          .split(",")
          .map(s => this.toNum(s.trim()))
          .filter((t): t is number => t !== undefined);
      } else {
        const n = this.toNum(type);
        if (n !== undefined) types = [n];
      }
      if (types.length) qb.andWhere("event.type IN (:...types)", { types });
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

    qb.orderBy("event.timestamp", "DESC")
      .take(take)
      .skip(skip);

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

  async getEventsByType(type: number, filters: Partial<EventFilters> = {}) {
    return this.getEvents({ ...filters, type });
  }

  // Now uses event_mapping.is_alert
  async getAlerts(filters: Partial<EventFilters> = {}) {
    const alertTypes = await mappingService.getAlertTypes();
    if (alertTypes.length === 0) {
      return {
        events: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };
    }
    return this.getEvents({ ...filters, type: alertTypes });
  }

  async getAlertsByDevice(device_id: string, filters: Partial<EventFilters> = {}) {
    return this.getAlerts({ ...filters, device_id });
  }

  async debugTimestamps() {
    const result = await this.repo
      .createQueryBuilder()
      .select("MIN(timestamp)", "min")
      .addSelect("MAX(timestamp)", "max")
      .getRawOne();
    console.log("DB timestamps → min:", result.min, "max:", result.max);
  }
}