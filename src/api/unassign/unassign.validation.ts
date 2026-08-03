import Joi from "joi";

export const getUnassignLogsSchema = Joi.object({
  page:    Joi.number().integer().min(1).default(1),
  limit:   Joi.number().integer().min(1).max(100).default(20),
  meterId: Joi.string().optional().allow(""),
  hhid:    Joi.string().optional().allow(""),
});