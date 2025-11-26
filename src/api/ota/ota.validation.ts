// src/api/ota/ota.validation.ts
import { env } from "../../config/env";
import Joi from "joi";

export const createOtaJobSchema = Joi.object({
  version: Joi.string().required(),
  bucketName: Joi.string().default(env.aws.defaultBucket),
  thingGroupName: Joi.string().optional(),
  thingNames: Joi.string().optional(),
  downloadPath: Joi.string().min(1).required(),
});