// src/services/events/event.service.ts
import {
  EventFilters,
  PaginatedEvents,
  LiveMonitoringFilters,
  PaginatedLiveMonitoring,
  ViewershipFilters,
  PaginatedViewership,
  LiveMonitoringItem,
  ViewershipItem,
  ConnectivityReportItem,
  PaginatedConnectivityReport,
  ButtonPressedReportItem,
  PaginatedButtonPressedReport
} from "../../api/events/events.types";
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

  /**
   * Get live monitoring data - assigned meters with last event timestamp
   */
  async getLiveMonitoring(filters: LiveMonitoringFilters = {}): Promise<PaginatedLiveMonitoring> {
    const { device_id, hhid, page = 1, limit = 25 } = filters;

    // Remove strict limit cap to support large exports if requested
    const take = limit;
    const skip = (page - 1) * take;

    // Prepare dynamic conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (device_id) {
      params.push(`%${device_id}%`);
      conditions.push(`m.meter_id ILIKE $${params.length}`);
    }
    if (hhid) {
      params.push(`%${hhid}%`);
      conditions.push(`h.hhid ILIKE $${params.length}`);
    }

    // Add pagination params
    params.push(take, skip);

    // Query with latest household per meter and absolute last event timestamp using LATERAL JOIN
    const query = `
    WITH latest_assignments AS (
      SELECT DISTINCT ON (ma.meter_id)
        ma.meter_id,
        ma.household_id
      FROM meter_assignments ma
      INNER JOIN meters m ON ma.meter_id = m.id
      WHERE m.meter_id BETWEEN 'IM000101' AND 'IM000600'
      ORDER BY ma.meter_id, ma.assigned_at DESC
    )
    SELECT
      m.meter_id AS device_id,
      h.hhid,
      le.last_event_timestamp,
      COUNT(*) OVER() AS total_count
    FROM latest_assignments la
    INNER JOIN meters m ON la.meter_id = m.id
    INNER JOIN households h ON la.household_id = h.id
    LEFT JOIN LATERAL (
      SELECT timestamp AS last_event_timestamp
      FROM events e
      WHERE e.device_id = m.meter_id
      ORDER BY e.timestamp DESC
      LIMIT 1
    ) le ON TRUE
    ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
    ORDER BY le.last_event_timestamp DESC NULLS LAST
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `;

    const results = await AppDataSource.query(query, params);

    const data: LiveMonitoringItem[] = results.map((row: any) => ({
      device_id: row.device_id,
      hhid: row.hhid,
      last_event_timestamp: row.last_event_timestamp ? parseInt(row.last_event_timestamp) : null,
    }));

    const total = results.length > 0 ? parseInt(results[0].total_count) : 0;

    return {
      data,
      pagination: {
        page,
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    };
  }


  async getViewership(filters: ViewershipFilters = {}): Promise<PaginatedViewership> {
    const { data, total } = await this.getGeneralReport(filters, [29, 42]);
    return {
      data: data.map(v => ({ ...v, viewership: v.status })),
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 25,
        total,
        pages: Math.ceil(total / (filters.limit || 25)),
      }
    };
  }

  /**
   * Helper to get report data (Connectivity, Viewership, Button Pressed)
   */
  private async getGeneralReport(
    filters: ViewershipFilters,
    types?: number[]
  ): Promise<{ data: any[]; total: number }> {
    const { device_id, hhid, date, page = 1, limit = 25 } = filters;

    const take = limit;
    const skip = (page - 1) * take;

    // Calculate date range (default to today)
    const targetDate = date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

    // Prepare dynamic conditions
    const conditions: string[] = [];
    const params: any[] = [startTimestamp, endTimestamp];

    if (device_id) {
      params.push(`%${device_id}%`);
      conditions.push(`m.meter_id ILIKE $${params.length}`);
    }
    if (hhid) {
      params.push(`%${hhid}%`);
      conditions.push(`h.hhid ILIKE $${params.length}`);
    }

    // Add pagination params
    params.push(take, skip);

    const typeCondition = types && types.length ? `AND e.type IN (${types.join(',')})` : '';

    const query = `
      WITH latest_assignments AS (
        SELECT DISTINCT ON (ma.meter_id)
          ma.meter_id,
          ma.household_id
        FROM meter_assignments ma
        INNER JOIN meters m ON ma.meter_id = m.id
        WHERE m.meter_id BETWEEN 'IM000101' AND 'IM000600'
        ORDER BY ma.meter_id, ma.assigned_at DESC
      )
      SELECT 
        m.meter_id AS device_id,
        h.hhid,
        CASE WHEN COUNT(e.id) > 0 THEN 'Yes' ELSE 'No' END AS status,
        COUNT(*) OVER() AS total_count
      FROM latest_assignments la
      INNER JOIN meters m ON la.meter_id = m.id
      INNER JOIN households h ON la.household_id = h.id
      LEFT JOIN events e ON e.device_id = m.meter_id
        AND e.timestamp >= $1
        AND e.timestamp <= $2
        ${typeCondition}
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      GROUP BY m.meter_id, h.hhid
      ORDER BY m.meter_id
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `;

    const results = await AppDataSource.query(query, params);
    const total = results.length > 0 ? parseInt(results[0].total_count) : 0;

    return {
      data: results.map((row: any) => ({
        device_id: row.device_id,
        hhid: row.hhid,
        status: row.status,
        date: targetDate,
      })),
      total
    };
  }

  async getConnectivityReport(filters: ViewershipFilters = {}): Promise<PaginatedConnectivityReport> {
    const { data, total } = await this.getGeneralReport(filters);
    return {
      data: data.map(v => ({ ...v, connectivity: v.status })),
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 25,
        total,
        pages: Math.ceil(total / (filters.limit || 25)),
      }
    };
  }

  async getButtonPressedReport(filters: ViewershipFilters = {}): Promise<PaginatedButtonPressedReport> {
    const { data, total } = await this.getGeneralReport(filters, [3]);
    return {
      data: data.map(v => ({ ...v, button_pressed: v.status })),
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 25,
        total,
        pages: Math.ceil(total / (filters.limit || 25)),
      }
    };
  }
}