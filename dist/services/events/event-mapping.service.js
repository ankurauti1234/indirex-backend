"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMappingService = void 0;
// src/services/events/event-mapping.service.ts
const connection_1 = require("../../database/connection");
const EventMapping_1 = require("../../database/entities/EventMapping");
const errors_1 = require("../../utils/errors");
class EventMappingService {
    repo = connection_1.AppDataSource.getRepository(EventMapping_1.EventMapping);
    async getAll() {
        return this.repo.find({ order: { type: "ASC" } });
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
