"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRemoteAccessLogs1762100000005 = void 0;
class CreateRemoteAccessLogs1762100000005 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "remote_access_logs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "meterId" VARCHAR NOT NULL,
        "port" INTEGER NOT NULL,
        "clientIp" VARCHAR,
        "userAgent" VARCHAR,
        "connectedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "disconnectedAt" TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX "idx_remote_logs_userId" ON "remote_access_logs"("userId");
      CREATE INDEX "idx_remote_logs_meterId" ON "remote_access_logs"("meterId");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "remote_access_logs"`);
    }
}
exports.CreateRemoteAccessLogs1762100000005 = CreateRemoteAccessLogs1762100000005;
