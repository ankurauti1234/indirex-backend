"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMetersTable1762100000006 = void 0;
class CreateMetersTable1762100000006 {
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "meters"`);
    }
}
exports.CreateMetersTable1762100000006 = CreateMetersTable1762100000006;
