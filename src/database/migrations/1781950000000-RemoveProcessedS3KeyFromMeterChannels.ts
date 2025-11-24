// src/database/migrations/1731950000000-RemoveProcessedS3KeyFromMeterChannels.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProcessedS3KeyFromMeterChannels1731950000000 implements MigrationInterface {
    name = "RemoveProcessedS3KeyFromMeterChannels1731950000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop foreign key or index if it existed (unlikely here, but safe)
        await queryRunner.query(`
            ALTER TABLE meter_channels 
            DROP COLUMN IF EXISTS processed_s3_key;
        `);

        // 2. Add created_at column if not exists (idempotent)
        await queryRunner.query(`
            ALTER TABLE meter_channels 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        `);

        // 3. Create recommended index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_meter_channels_device_timestamp 
            ON meter_channels(device_id, timestamp);
        `);

        // 4. Optional: Create index on status or label if you query by them often
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_meter_channels_status 
            ON meter_channels(status);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: add back the column (with NOT NULL + default empty string)
        await queryRunner.query(`
            ALTER TABLE meter_channels 
            ADD COLUMN processed_s3_key TEXT NOT NULL DEFAULT '';
        `);

        // Remove created_at if you want full revert
        await queryRunner.query(`
            ALTER TABLE meter_channels 
            DROP COLUMN IF EXISTS created_at;
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_meter_channels_device_timestamp;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_meter_channels_status;`);
    }
}