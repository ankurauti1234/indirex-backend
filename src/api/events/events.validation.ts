import Joi from "joi";

export const eventsQuerySchema = Joi.object({
  device_id: Joi.string().optional(),
  type: Joi.string()
    .pattern(/^\d+(,\d+)*$/) // Single or comma-separated numbers
    .optional(),
  start_time: Joi.number().min(0).optional(), // Unix timestamp
  end_time: Joi.number().min(0).optional(), // Unix timestamp
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
});

export const eventTypeQuerySchema = eventsQuerySchema.keys({
  type: Joi.number().required(), // For /type/:type
});

export const liveMonitoringQuerySchema = Joi.object({
  device_id: Joi.string().optional(),
  hhid: Joi.string().optional(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(999999).default(25),
});

export const viewershipQuerySchema = Joi.object({
  device_id: Joi.string().optional(),
  hhid: Joi.string().optional(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  status: Joi.string().valid("Yes", "No").optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(999999).default(25),
});