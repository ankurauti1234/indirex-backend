// src/database/migrations/1762100000006-CreateMetersTable.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMetersTable1762100000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "meters" (
        "meterId" VARCHAR PRIMARY KEY,
        "groupName" VARCHAR NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'unregistered',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_meters_groupName" ON "meters"("groupName")`);
    await queryRunner.query(`CREATE INDEX "idx_meters_status" ON "meters"("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "meters"`);
  }
}