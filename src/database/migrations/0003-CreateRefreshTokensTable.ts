// src/database/migrations/0003-CreateRefreshTokensTable.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshTokensTable1762151477943 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}