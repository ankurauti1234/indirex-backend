// src/database/migrations/0004-CreateEventsTable.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventsTable1762151474637 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "events"`);
  }
}