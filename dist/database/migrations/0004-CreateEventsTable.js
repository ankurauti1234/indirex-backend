"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEventsTable1762151474637 = void 0;
class CreateEventsTable1762151474637 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "events" (
        "id" SERIAL PRIMARY KEY,
        "device_id" VARCHAR NOT NULL,
        "timestamp" BIGINT NOT NULL,
        "type" INTEGER NOT NULL,
        "details" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE INDEX "idx_events_device_id" ON "events"("device_id");
      CREATE INDEX "idx_events_timestamp" ON "events"("timestamp");
      CREATE INDEX "idx_events_type" ON "events"("type");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "events"`);
    }
}
exports.CreateEventsTable1762151474637 = CreateEventsTable1762151474637;
