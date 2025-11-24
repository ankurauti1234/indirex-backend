// src/database/migrations/1785000000000-CreateDecommissionLogsTable.ts
import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateDecommissionLogsTable1785000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "decommission_logs",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          },
          {
            name: "meter_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "household_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "decommissioned_by_user_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "reason",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "decommissioned_at",
            type: "timestamp with time zone",
            default: "CURRENT_TIMESTAMP",
          },
        ],
        foreignKeys: [
          {
            name: "FK_decommission_log_meter",
            columnNames: ["meter_id"],
            referencedTableName: "meters",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
          {
            name: "FK_decommission_log_household",
            columnNames: ["household_id"],
            referencedTableName: "households",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
          {
            name: "FK_decommission_log_user",
            columnNames: ["decommissioned_by_user_id"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "SET NULL",
          },
        ],
        indices: [
          {
            name: "IDX_decommission_log_meter",
            columnNames: ["meter_id"],
          },
          {
            name: "IDX_decommission_log_household",
            columnNames: ["household_id"],
          },
          {
            name: "IDX_decommission_log_date",
            columnNames: ["decommissioned_at"],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("decommission_logs");
  }
}