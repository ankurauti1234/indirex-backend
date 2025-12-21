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

  async getAll(filters: any = {}): Promise<{
    data: EventMapping[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryBuilder = this.repo.createQueryBuilder("em");

    // Search in type, name, and description
    if (filters.search) {
      const search = filters.search.trim();
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

    if (filters.is_alert !== undefined && filters.is_alert !== "") {
      queryBuilder.andWhere("em.is_alert = :is_alert", {
        is_alert: filters.is_alert === "true" || filters.is_alert === true,
      });
    }

    if (filters.enabled !== undefined && filters.enabled !== "") {
      queryBuilder.andWhere("em.enabled = :enabled", {
        enabled: filters.enabled === "true" || filters.enabled === true,
      });
    }

    if (filters.severity) {
      queryBuilder.andWhere("em.severity = :severity", {
        severity: filters.severity,
      });
    }

    queryBuilder.orderBy("em.type", "ASC");

    // Pagination
    const page = parseInt(filters.page as string, 10) || 1;
    const limit = parseInt(filters.limit as string, 10) || 25;
    const skip = (page - 1) * limit;

    // If no filters or pagination requested, return just the array
    const hasFiltersOrPagination =
      filters.search ||
      filters.is_alert !== undefined ||
      filters.severity ||
      filters.enabled !== undefined ||
      filters.page ||
      filters.limit;

    if (!hasFiltersOrPagination) {
      const data = await queryBuilder.getMany();
      return { data };
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