// src/api/ota/ota.types.ts
export interface CreateOtaJobDto {
  version: string;
  bucketName?: string;     // optional – default in Joi
  thingGroupName?: string;
  thingNames?: string;
  downloadPath?: string;   // optional – default in Joi
}

export interface OtaJobResponse {
  jobId: string;
  jobArn: string;
  updateUrl: string;
  jobDocumentS3: string;
  targets: string[];
} 