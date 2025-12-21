// src/api/events/event-mapping.controller.ts
import { Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { EventMappingService } from "../../services/events/event-mapping.service";
import {
  CreateEventMappingDTO,
  UpdateEventMappingDTO,
} from "./event-mapping.types";

const service = new EventMappingService();

export const getEventMappings = async (req: Request, res: Response) => {
  const filters = req.query;
  const result = await service.getAll(filters);

  // result is now { data: EventMapping[], pagination?: {...} }
  sendSuccess(res, result.data, "Event mappings retrieved", 200, result.pagination);
};

export const getEventMapping = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const mapping = await service.getById(id);
  sendSuccess(res, mapping);
};

export const createEventMapping = async (req: Request, res: Response) => {
  const dto: CreateEventMappingDTO = req.body;
  const mapping = await service.create(dto);
  sendSuccess(res, mapping, "Event mapping created", 201);
};

export const updateEventMapping = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const dto: UpdateEventMappingDTO = req.body;
  const mapping = await service.update(id, dto);
  sendSuccess(res, mapping, "Event mapping updated");
};

export const deleteEventMapping = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  await service.delete(id);
  sendSuccess(res, null, "Event mapping deleted", 204);
};