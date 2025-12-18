// src/api/assets/assets.validation.ts
import Joi from "joi";

export const uploadSchema = Joi.object({
  groupName: Joi.string().required(),
});

export const listMetersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  meterId: Joi.string().optional(),
  status: Joi.string().optional(),
  powerHATStatus: Joi.string().optional(),
  groupName: Joi.string().optional(),
  meterType: Joi.string().optional(),
});
 

export const updateMeterSchema = Joi.object({
  meterType: Joi.string().optional(),
  assetSerialNumber: Joi.string().optional(), 
  powerHATStatus: Joi.string().optional(),
}).min(1);

export const groupsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const groupThingsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});