// src/api/decommission/decommission.validation.ts
import Joi from "joi";

export const decommissionMeterSchema = Joi.object({
  meterId: Joi.string().required().messages({
    "any.required": "meterId is required",
    "string.empty": "meterId cannot be empty",
  }),
  reason: Joi.string().max(500).optional().allow("").default(null),
});

export const listAssignedMetersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().optional().allow(""),
});

export const getDecommissionLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  meterId: Joi.string().optional(),
  hhid: Joi.string().optional(),
});