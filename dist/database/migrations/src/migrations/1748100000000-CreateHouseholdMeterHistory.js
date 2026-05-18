"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateHouseholdMeterHistory1748100000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateHouseholdMeterHistory1748100000000 {
    constructor() {
        this.name = "CreateHouseholdMeterHistory1748100000000";
    }
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
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
        }), true);
        await queryRunner.createForeignKey("household_meter_history", new typeorm_1.TableForeignKey({
            columnNames: ["meter_id"],
            referencedTableName: "meters",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
        }));
        await queryRunner.createForeignKey("household_meter_history", new typeorm_1.TableForeignKey({
            columnNames: ["household_id"],
            referencedTableName: "households",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
        }));
        await queryRunner.createIndex("household_meter_history", new typeorm_1.TableIndex({ columnNames: ["meter_id"] }));
        await queryRunner.createIndex("household_meter_history", new typeorm_1.TableIndex({ columnNames: ["household_id"] }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable("household_meter_history", true);
    }
}
exports.CreateHouseholdMeterHistory1748100000000 = CreateHouseholdMeterHistory1748100000000;
//# sourceMappingURL=1748100000000-CreateHouseholdMeterHistory.js.map