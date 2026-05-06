// src/api/alerts/alerts.validation.ts
import Joi from "joi";

export const addRecipientSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().max(100).optional().allow("", null),
});

export const updateSettingsSchema = Joi.object({
  inactivityThresholdHours: Joi.number().integer().min(1).max(720).optional(),
  emailFrequencyHours: Joi.number().integer().min(1).max(720).optional(),
}).min(1);

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(25),
  device_id: Joi.string().optional().allow(""),
});
