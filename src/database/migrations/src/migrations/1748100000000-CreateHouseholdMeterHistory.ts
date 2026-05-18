import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateHouseholdMeterHistory1748100000000 implements MigrationInterface {
  name = "CreateHouseholdMeterHistory1748100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "household_meter_history",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
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
            name: "assigned_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "decommissioned_at",
            type: "timestamptz",
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "household_meter_history",
      new TableForeignKey({
        columnNames: ["meter_id"],
        referencedTableName: "meters",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "household_meter_history",
      new TableForeignKey({
        columnNames: ["household_id"],
        referencedTableName: "households",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createIndex(
      "household_meter_history",
      new TableIndex({ columnNames: ["meter_id"] })
    );

    await queryRunner.createIndex(
      "household_meter_history",
      new TableIndex({ columnNames: ["household_id"] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("household_meter_history", true);
  }
}