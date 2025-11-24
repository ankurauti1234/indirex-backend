// src/database/migrations/1734420000000-AddMeterExtraFields.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMeterExtraFields1774420000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE meters
      ADD COLUMN IF NOT EXISTS meter_type VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS asset_serial_number VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS power_hat_status VARCHAR(50) NULL;
    `);

    // Optional: Add indexes if needed for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meters_meter_type ON meters(meter_type);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meters_asset_serial_number ON meters(asset_serial_number);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meters_power_hat_status ON meters(power_hat_status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_meters_power_hat_status;
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_meters_asset_serial_number;
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_meters_meter_type;
    `);

    await queryRunner.query(`
      ALTER TABLE meters
      DROP COLUMN IF EXISTS meter_type,
      DROP COLUMN IF EXISTS asset_serial_number,
      DROP COLUMN IF EXISTS power_hat_status;
    `);
  }
}