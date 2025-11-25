"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUsersTable1762151479611 = void 0;
class CreateUsersTable1762151479611 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "name" VARCHAR NOT NULL,
        "role" VARCHAR NOT NULL DEFAULT 'viewer',
        "isActive" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
exports.CreateUsersTable1762151479611 = CreateUsersTable1762151479611;
