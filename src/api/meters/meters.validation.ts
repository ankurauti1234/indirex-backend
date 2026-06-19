import Joi from "joi";

export const unassignMeterSchema = Joi.object({
  hhid: Joi.string().trim().required(),
  meterId: Joi.string().trim().required(),
});