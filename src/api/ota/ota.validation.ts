// src/api/ota/ota.validation.ts
import { version } from "os";
import { env } from "../../config/env";
import Joi from "joi";

export const createOtaJobSchema = Joi.object({
  version: Joi.string().required(),
  bucketName: Joi.string().default(env.aws.defaultBucket),
  thingGroupName: Joi.string().optional(),
  thingNames: Joi.string().optional(),
  downloadPath: Joi.string().min(1).required(),
}); 

export const getMyJobsSchema = Joi.object({
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});