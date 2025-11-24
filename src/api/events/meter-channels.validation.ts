import Joi from "joi";

export const meterChannelsQuerySchema = Joi.object({
  device_id: Joi.string().optional(),               // <-- now optional
  status: Joi.string().valid("recognized", "unrecognized").optional(),
  start_time: Joi.number().min(0).optional(),
  end_time: Joi.number().min(0).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
});