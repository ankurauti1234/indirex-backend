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

  async getAll(filters: any = {}): Promise<any> {
    const queryBuilder = this.repo.createQueryBuilder("em");

    // Updated search: look in both 'type' and 'name'
    if (filters.search) {
      const search = filters.search.trim();

      // If search is a number, also match on type
      const isNumeric = !isNaN(search) && !isNaN(parseInt(search));

      if (isNumeric) {
        const typeValue = parseInt(search, 10);
        queryBuilder.andWhere(
          "(em.type = :typeValue OR em.name ILIKE :search OR em.description ILIKE :search)",
          { typeValue, search: `%${search}%` }
        );
      } else {
        queryBuilder.andWhere(
          "(em.name ILIKE :search OR em.description ILIKE :search)",
          { search: `%${search}%` }
        );
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
    if (
      !filters.search &&
      filters.is_alert === undefined &&
      filters.severity === undefined &&
      filters.enabled === undefined &&
      !filters.page &&
      !filters.limit
    ) {
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