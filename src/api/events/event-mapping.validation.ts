// src/api/events/event-mapping.validation.ts
import Joi from "joi";

export const createEventMappingSchema = Joi.object({
  type: Joi.number().integer().required(),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional().allow(""),
  is_alert: Joi.boolean().default(false),
  severity: Joi.string().valid("low", "medium", "high", "critical").default("medium"),
  enabled: Joi.boolean().default(true),
});

export const updateEventMappingSchema = createEventMappingSchema.fork(
  ["type", "name"],
  (schema) => schema.optional()
);

export const eventMappingFilterSchema = Joi.object({
  search: Joi.string().optional(),
  is_alert: Joi.boolean().optional(),
  severity: Joi.string().valid("low", "medium", "high", "critical").optional(),
  enabled: Joi.boolean().optional(),
  page: Joi.number().default(1),
  limit: Joi.number().default(25),
});
