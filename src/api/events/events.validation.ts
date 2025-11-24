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