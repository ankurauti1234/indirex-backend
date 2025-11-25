"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOtaJobsTable1762151476379 = void 0;
class CreateOtaJobsTable1762151476379 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "ota_jobs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "version" VARCHAR NOT NULL,
        "fileName" VARCHAR NOT NULL,
        "s3KeyUpdate" VARCHAR NOT NULL,
        "s3UrlUpdate" VARCHAR NOT NULL,
        "s3KeyJobDoc" VARCHAR NOT NULL,
        "s3UrlJobDoc" VARCHAR NOT NULL,
        "downloadPath" VARCHAR NOT NULL,
        "targets" TEXT[] NOT NULL,
        "jobId" VARCHAR NOT NULL,
        "jobArn" VARCHAR,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "userId" UUID NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_ota_jobs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_ota_jobs_userId" ON "ota_jobs"("userId");
      CREATE INDEX "idx_ota_jobs_status" ON "ota_jobs"("status");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "ota_jobs"`);
    }
}
exports.CreateOtaJobsTable1762151476379 = CreateOtaJobsTable1762151476379;
