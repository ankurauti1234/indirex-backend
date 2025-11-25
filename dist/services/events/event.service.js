"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const connection_1 = require("../../database/connection");
const Event_1 = require("../../database/entities/Event");
const event_mapping_service_1 = require("./event-mapping.service");
const mappingService = new event_mapping_service_1.EventMappingService();
class EventService {
    repo = connection_1.AppDataSource.getRepository(Event_1.Event);
    toNum(val) {
        if (val === undefined || val === null || val === "")
            return undefined;
        const n = Number(val);
        return isNaN(n) ? undefined : n;
    }
    async getEvents(filters = {}) {
        const { device_id, type, start_time, end_time, page = 1, limit = 10, } = filters;
        const take = Math.min(limit, 100);
        const skip = (page - 1) * take;
        const qb = this.repo.createQueryBuilder("event");
        if (device_id)
            qb.andWhere("event.device_id = :device_id", { device_id });
        if (type !== undefined) {
            let types = [];
            if (Array.isArray(type)) {
                types = type.map(t => this.toNum(t)).filter((t) => t !== undefined);
            }
            else if (typeof type === "string") {
                types = type
                    .split(",")
                    .map(s => this.toNum(s.trim()))
                    .filter((t) => t !== undefined);
            }
            else {
                const n = this.toNum(type);
                if (n !== undefined)
                    types = [n];
            }
            if (types.length)
                qb.andWhere("event.type IN (:...types)", { types });
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
    async getEventsByType(type, filters = {}) {
        return this.getEvents({ ...filters, type });
    }
    // Now uses event_mapping.is_alert
    async getAlerts(filters = {}) {
        const alertTypes = await mappingService.getAlertTypes();
        if (alertTypes.length === 0) {
            return {
                events: [],
                pagination: { page: 1, limit: 10, total: 0, pages: 0 },
            };
        }
        return this.getEvents({ ...filters, type: alertTypes });
    }
    async getAlertsByDevice(device_id, filters = {}) {
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
exports.EventService = EventService;
