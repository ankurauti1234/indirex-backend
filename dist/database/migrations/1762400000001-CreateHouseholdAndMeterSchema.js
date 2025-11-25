"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateHouseholdAndMeterSchema1762400000001 = void 0;
class CreateHouseholdAndMeterSchema1762400000001 {
    async up(queryRunner) {
        await queryRunner.query(`
      -- Enable UUID generation
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- =============================================
      -- 1️⃣ households
      -- =============================================
      CREATE TABLE "households" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "hhid" VARCHAR(10) UNIQUE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- =============================================
      -- 2️⃣ members
      -- =============================================
      CREATE TABLE "members" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "household_id" UUID NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "member_code" VARCHAR(10) NOT NULL,
        "dob" DATE NOT NULL,
        "gender" VARCHAR(10),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT "unique_household_member_code" UNIQUE ("household_id", "member_code")
      );
      CREATE INDEX "idx_members_household_id" ON "members"("household_id");

      -- =============================================
      -- 3️⃣ meters
      -- =============================================
      CREATE TABLE "meters" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "meter_id" VARCHAR(50) UNIQUE NOT NULL,
        "assigned_household_id" UUID REFERENCES "households"("id") ON DELETE SET NULL,
        "is_assigned" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX "idx_meters_assigned_household_id" ON "meters"("assigned_household_id");

      -- =============================================
      -- 4️⃣ meter_otps
      -- =============================================
      CREATE TABLE "meter_otps" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "meter_id" UUID NOT NULL REFERENCES "meters"("id") ON DELETE CASCADE,
        "otp_code" VARCHAR(10) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "consumed" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX "idx_meter_otps_meter_id" ON "meter_otps"("meter_id");
      CREATE INDEX "idx_meter_otps_valid_otp" ON "meter_otps"("meter_id", "otp_code", "consumed");

      -- =============================================
      -- 5️⃣ meter_assignments
      -- =============================================
      CREATE TABLE "meter_assignments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "meter_id" UUID NOT NULL REFERENCES "meters"("id") ON DELETE CASCADE,
        "household_id" UUID NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "assigned_by" VARCHAR(50),
        "assigned_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT "unique_meter_household" UNIQUE ("meter_id", "household_id")
      );
      CREATE INDEX "idx_meter_assignments_meter_id" ON "meter_assignments"("meter_id");
      CREATE INDEX "idx_meter_assignments_household_id" ON "meter_assignments"("household_id");

      -- =============================================
      -- 6️⃣ preregistered_contacts
      -- =============================================
      CREATE TABLE "preregistered_contacts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "household_id" UUID NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "contact_email" VARCHAR(255) NOT NULL,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX "idx_preregistered_contacts_household_id" ON "preregistered_contacts"("household_id");
      CREATE INDEX "idx_preregistered_contacts_active_email" ON "preregistered_contacts"("household_id", "is_active");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP TABLE IF EXISTS "preregistered_contacts";
      DROP TABLE IF EXISTS "meter_assignments";
      DROP TABLE IF EXISTS "meter_otps";
      DROP TABLE IF EXISTS "meters";
      DROP TABLE IF EXISTS "members";
      DROP TABLE IF EXISTS "households";
    `);
    }
}
exports.CreateHouseholdAndMeterSchema1762400000001 = CreateHouseholdAndMeterSchema1762400000001;
