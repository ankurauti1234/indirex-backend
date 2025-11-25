"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableUuidOssp1762151481142 = void 0;
class EnableUuidOssp1762151481142 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }
}
exports.EnableUuidOssp1762151481142 = EnableUuidOssp1762151481142;
