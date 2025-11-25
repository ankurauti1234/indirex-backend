"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEventMapping1775820000000 = void 0;
// src/database/migrations/1731820000000-CreateEventMapping.ts
const typeorm_1 = require("typeorm");
class CreateEventMapping1775820000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "event_mapping",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                { name: "type", type: "int", isUnique: true },
                { name: "name", type: "varchar" },
                { name: "description", type: "text", isNullable: true },
                { name: "is_alert", type: "boolean", default: false },
                { name: "severity", type: "varchar", default: "'default'" },
                { name: "enabled", type: "boolean", default: true },
            ],
        }), true);
        // Seed initial alert mappings
        await queryRunner.query(`
      INSERT INTO event_mapping (type, name, description, is_alert, severity, enabled)
      VALUES
        (14, 'Tamper Detected', 'Physical tampering detected', true, 'high', true),
        (15, 'Power Failure', 'Device lost power', true, 'critical', true),
        (16, 'Low Battery', 'Battery below threshold', true, 'medium', true),
        (21, 'Communication Failure', 'No heartbeat', true, 'high', true),
        (22, 'Firmware Update Failed', 'OTA update failed', true, 'medium', true)
      ON CONFLICT (type) DO NOTHING;
    `);
    }
    async down(queryRunner) {
        await queryRunner.dropTable("event_mapping");
    }
}
exports.CreateEventMapping1775820000000 = CreateEventMapping1775820000000;
