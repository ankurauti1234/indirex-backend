// src/api/ota/ota.validation.ts
import Joi from "joi";

export const createOtaJobSchema = Joi.object({
  version: Joi.string().required(),
  bucketName: Joi.string().default(process.env.DEFAULT_S3_BUCKET),
  thingGroupName: Joi.string().optional(),
  thingNames: Joi.string().optional(),
  downloadPath: Joi.string().min(1).required(),
});