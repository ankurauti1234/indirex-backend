"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMappingService = void 0;
// src/services/events/event-mapping.service.ts
const connection_1 = require("../../database/connection");
const EventMapping_1 = require("../../database/entities/EventMapping");
const errors_1 = require("../../utils/errors");
class EventMappingService {
    constructor() {
        this.repo = connection_1.AppDataSource.getRepository(EventMapping_1.EventMapping);
    }
    async getAll(filters = {}) {
        const queryBuilder = this.repo.createQueryBuilder("em");
        // Updated search: look in both 'type' and 'name'
        if (filters.search) {
            const search = filters.search.trim();
            // If search is a number, also match on type
            const isNumeric = !isNaN(search) && !isNaN(parseInt(search));
            if (isNumeric) {
                const typeValue = parseInt(search, 10);
                queryBuilder.andWhere("(em.type = :typeValue OR em.name ILIKE :search OR em.description ILIKE :search)", { typeValue, search: `%${search}%` });
            }
            else {
                queryBuilder.andWhere("(em.name ILIKE :search OR em.description ILIKE :search)", { search: `%${search}%` });
            }
        }
        if (filters.is_alert !== undefined) {
            queryBuilder.andWhere("em.is_alert = :is_alert", {
                is_alert: filters.is_alert,
            });
        }
        if (filters.enabled !== undefined) {
            queryBuilder.andWhere("em.enabled = :enabled", {
                enabled: filters.enabled,
            });
        }
        if (filters.severity) {
            queryBuilder.andWhere("em.severity = :severity", {
                severity: filters.severity,
            });
        }
        queryBuilder.orderBy("em.type", "ASC");
        // Pagination logic
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 25;
        const skip = (page - 1) * limit;
        // Return all if no filters/pagination
        if (!filters.search &&
            filters.is_alert === undefined &&
            filters.severity === undefined &&
            filters.enabled === undefined &&
            !filters.page &&
            !filters.limit) {
            return queryBuilder.getMany();
        }
        const [data, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getById(id) {
        const mapping = await this.repo.findOne({ where: { id } });
        if (!mapping)
            throw new errors_1.NotFoundError("Event mapping not found");
        return mapping;
    }
    async getByType(type) {
        return this.repo.findOne({ where: { type } });
    }
    async create(dto) {
        const exists = await this.repo.findOne({ where: { type: dto.type } });
        if (exists)
            throw new errors_1.ConflictError("Event type already mapped");
        const mapping = this.repo.create(dto);
        return this.repo.save(mapping);
    }
    async update(id, dto) {
        const mapping = await this.getById(id);
        Object.assign(mapping, dto);
        return this.repo.save(mapping);
    }
    async delete(id) {
        const mapping = await this.getById(id);
        await this.repo.remove(mapping);
    }
    async getAlertTypes() {
        const result = await this.repo
            .createQueryBuilder("em")
            .select("em.type")
            .where("em.is_alert = true")
            .andWhere("em.enabled = true")
            .getMany();
        return result.map((r) => r.type);
    }
}
exports.EventMappingService = EventMappingService;
//# sourceMappingURL=event-mapping.service.js.map