"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRefreshTokensTable1762151477943 = void 0;
class CreateRefreshTokensTable1762151477943 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" SERIAL PRIMARY KEY,
        "token" VARCHAR NOT NULL UNIQUE,
        "userId" UUID NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_refresh_tokens_userId" ON "refresh_tokens"("userId");
      CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens"("token");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }
}
exports.CreateRefreshTokensTable1762151477943 = CreateRefreshTokensTable1762151477943;
