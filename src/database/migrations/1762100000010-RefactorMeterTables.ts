// src/database/migrations/1762100000010-RefactorMeterTables.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMeterTables1762100000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. CREATE iot_meters table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "iot_meters" (
        "meterId" VARCHAR PRIMARY KEY,
        "groupName" VARCHAR NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'unregistered',
        "lastSeen" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // 2. Indexes (idempotent)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_iot_meters_groupName" ON "iot_meters"("groupName")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_iot_meters_status" ON "iot_meters"("status")`);

    // 3. Remove columns from meters (if they exist)
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'meters' 
      AND column_name IN ('groupName', 'status')
    `);

    for (const { column_name } of columns) {
      await queryRunner.query(`ALTER TABLE "meters" DROP COLUMN IF EXISTS "${column_name}"`);
    }

    // 4. Drop old indexes (if they exist)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_meters_groupName"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_meters_status"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: add back columns
    await queryRunner.query(`ALTER TABLE "meters" ADD COLUMN IF NOT EXISTS "groupName" VARCHAR NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "meters" ADD COLUMN IF NOT EXISTS "status" VARCHAR NOT NULL DEFAULT 'unregistered'`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_meters_groupName" ON "meters"("groupName")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_meters_status" ON "meters"("status")`);

    // Drop iot_meters
    await queryRunner.query(`DROP TABLE IF EXISTS "iot_meters"`);
  }
}