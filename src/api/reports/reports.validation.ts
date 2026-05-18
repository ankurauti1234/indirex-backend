// src/api/reports/reports.validation.ts
import Joi from "joi";

export const reportQuerySchema = Joi.object({
  type: Joi.string().pattern(/^\d+(,\d+)*$/).optional(),
  start_time: Joi.number().min(0).optional(),
  end_time: Joi.number().min(0).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  format: Joi.string().valid("json", "csv", "xlsx", "xml").default("json"),
}); 