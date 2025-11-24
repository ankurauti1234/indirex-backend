// src/services/events/event-mapping.service.ts
import { AppDataSource } from "../../database/connection";
import { EventMapping } from "../../database/entities/EventMapping";
import {
  CreateEventMappingDTO,
  UpdateEventMappingDTO,
} from "../../api/events/event-mapping.types";
import { ConflictError, NotFoundError } from "../../utils/errors";

export class EventMappingService {
  private repo = AppDataSource.getRepository(EventMapping);

  async getAll(): Promise<EventMapping[]> {
    return this.repo.find({ order: { type: "ASC" } });
  }

  async getById(id: number): Promise<EventMapping> {
    const mapping = await this.repo.findOne({ where: { id } });
    if (!mapping) throw new NotFoundError("Event mapping not found");
    return mapping;
  }

  async getByType(type: number): Promise<EventMapping | null> {
    return this.repo.findOne({ where: { type } });
  }

  async create(dto: CreateEventMappingDTO): Promise<EventMapping> {
    const exists = await this.repo.findOne({ where: { type: dto.type } });
    if (exists) throw new ConflictError("Event type already mapped");

    const mapping = this.repo.create(dto);
    return this.repo.save(mapping);
  }

  async update(id: number, dto: UpdateEventMappingDTO): Promise<EventMapping> {
    const mapping = await this.getById(id);
    Object.assign(mapping, dto);
    return this.repo.save(mapping);
  }

  async delete(id: number): Promise<void> {
    const mapping = await this.getById(id);
    await this.repo.remove(mapping);
  }

  async getAlertTypes(): Promise<number[]> {
    const result = await this.repo
      .createQueryBuilder("em")
      .select("em.type")
      .where("em.is_alert = true")
      .andWhere("em.enabled = true")
      .getMany();

    return result.map((r) => r.type);
  }
}