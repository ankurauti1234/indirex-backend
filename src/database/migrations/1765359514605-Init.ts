import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1765359514605 implements MigrationInterface {
    name = 'Init1765359514605'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'developer', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'viewer', "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4542dd2f38a61354a040ba9fd5" ON "refresh_tokens" ("token") `);
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "device_id" character varying NOT NULL, "timestamp" bigint NOT NULL, "type" integer NOT NULL, "details" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_677f1dbebfe5223c39d15f229e" ON "events" ("device_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b5a6ad5d1dc980d07d07969525" ON "events" ("timestamp") `);
        await queryRunner.query(`CREATE TABLE "members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "member_code" character varying(10) NOT NULL, "dob" date NOT NULL, "gender" character varying(10), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "household_id" uuid, CONSTRAINT "PK_28b53062261b996d9c99fa12404" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e5b3122ec05edd36137e0afb39" ON "members" ("household_id", "member_code") `);
        await queryRunner.query(`CREATE TABLE "preregistered_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contact_email" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "household_id" uuid, CONSTRAINT "PK_3f9f584463e07985d96d18f28ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_65b61cb616a265e598a8d3844a" ON "preregistered_contacts" ("household_id") `);
        await queryRunner.query(`CREATE TABLE "meter_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assigned_by" character varying(50), "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), "meter_id" uuid, "household_id" uuid, CONSTRAINT "UQ_97e61afd176e5e5d80a986d6db2" UNIQUE ("meter_id", "household_id"), CONSTRAINT "PK_c3ae84b281e44f76ade12e3ee06" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8865870f499ac8cbde4e38cbd9" ON "meter_assignments" ("meter_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5b32e3c3fb5be83fad32d95745" ON "meter_assignments" ("household_id") `);
        await queryRunner.query(`CREATE TABLE "households" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hhid" character varying(10) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6011b285f45f36419ca38b5146c" UNIQUE ("hhid"), CONSTRAINT "PK_2b1aef2640717132e9231aac756" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "meter_otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "otp_code" character varying(10) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "consumed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "meter_id" uuid, CONSTRAINT "PK_dd45dacc9b8de1dd6198c512c3c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6850880a34ca1ed408bd9ee6bb" ON "meter_otps" ("meter_id") `);
        await queryRunner.query(`CREATE TABLE "meters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "meter_id" character varying(50) NOT NULL, "meter_type" character varying(50), "asset_serial_number" character varying(100), "power_hat_status" character varying(50), "is_assigned" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "assigned_household_id" uuid, CONSTRAINT "UQ_c18f44b4518fa3acb89ef700c5f" UNIQUE ("meter_id"), CONSTRAINT "PK_0a71b52dbb545fa36efaf070583" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9a86d6d705ad4883f3f0e9cb0b" ON "meters" ("assigned_household_id") `);
        await queryRunner.query(`CREATE TYPE "public"."iot_meters_status_enum" AS ENUM('registered', 'unregistered')`);
        await queryRunner.query(`CREATE TABLE "iot_meters" ("meterId" character varying NOT NULL, "groupName" character varying NOT NULL, "status" "public"."iot_meters_status_enum" NOT NULL DEFAULT 'unregistered', "lastSeen" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f1cfdbdebcd15d92920cea2f9a6" PRIMARY KEY ("meterId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9f70f06763ef8050d1cf726ce6" ON "iot_meters" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_3cc64181e9df93a83bec8ebc7a" ON "iot_meters" ("groupName") `);
        await queryRunner.query(`CREATE TYPE "public"."ota_jobs_status_enum" AS ENUM('pending', 'in_progress', 'succeeded', 'failed', 'canceled')`);
        await queryRunner.query(`CREATE TABLE "ota_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" character varying NOT NULL, "fileName" character varying NOT NULL, "s3KeyUpdate" character varying NOT NULL, "s3UrlUpdate" character varying NOT NULL, "s3KeyJobDoc" character varying NOT NULL, "s3UrlJobDoc" character varying NOT NULL, "downloadPath" character varying NOT NULL, "targets" text array NOT NULL, "jobId" character varying NOT NULL, "jobArn" character varying, "status" "public"."ota_jobs_status_enum" NOT NULL DEFAULT 'pending', "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_64e7d6fa9e260ea361c1718d66c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "remote_access_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "meterId" character varying NOT NULL, "port" integer NOT NULL, "clientIp" character varying, "userAgent" character varying, "disconnectedAt" TIMESTAMP, "connectedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c3cc3c3bff3862c4a5ad5eb1403" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "meter_channels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_id" text NOT NULL, "timestamp" bigint NOT NULL, "status" text NOT NULL, "label" text, "confidence" double precision, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c3f59f8716ba83e3f38ffbb87d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_meter_channels_device_timestamp" ON "meter_channels" ("device_id", "timestamp") `);
        await queryRunner.query(`CREATE TABLE "event_mapping" ("id" SERIAL NOT NULL, "type" integer NOT NULL, "name" character varying NOT NULL, "description" character varying, "is_alert" boolean NOT NULL DEFAULT false, "severity" character varying NOT NULL DEFAULT 'default', "enabled" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_c7d6add171bbd86b834e9e085e7" UNIQUE ("type"), CONSTRAINT "PK_80166922811d2be63e6162c8f3c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c7d6add171bbd86b834e9e085e" ON "event_mapping" ("type") `);
        await queryRunner.query(`CREATE TABLE "decommission_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "decommissioned_by_user_id" uuid, "reason" character varying(255), "metadata" jsonb, "decommissioned_at" TIMESTAMP NOT NULL DEFAULT now(), "meter_id" uuid NOT NULL, "household_id" uuid NOT NULL, CONSTRAINT "PK_8e98e344e935150a39bc609be23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3a58b4281deada1f4c0956a18c" ON "decommission_logs" ("meter_id", "household_id") `);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "members" ADD CONSTRAINT "FK_415e47bfa95b7897c35bdca6421" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "preregistered_contacts" ADD CONSTRAINT "FK_65b61cb616a265e598a8d3844ac" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meter_assignments" ADD CONSTRAINT "FK_8865870f499ac8cbde4e38cbd99" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meter_assignments" ADD CONSTRAINT "FK_5b32e3c3fb5be83fad32d957459" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meter_otps" ADD CONSTRAINT "FK_6850880a34ca1ed408bd9ee6bb2" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meters" ADD CONSTRAINT "FK_9a86d6d705ad4883f3f0e9cb0bf" FOREIGN KEY ("assigned_household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ota_jobs" ADD CONSTRAINT "FK_54cc40d921c4bf6fba629bd461f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "remote_access_logs" ADD CONSTRAINT "FK_32362b38b38f1c18398a684075a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "decommission_logs" ADD CONSTRAINT "FK_e56717838b141de03738ed5a2a0" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "decommission_logs" ADD CONSTRAINT "FK_72a7c94eab4a17fa66a0c3568f0" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "decommission_logs" ADD CONSTRAINT "FK_11653de56289a99ccd7955982ae" FOREIGN KEY ("decommissioned_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decommission_logs" DROP CONSTRAINT "FK_11653de56289a99ccd7955982ae"`);
        await queryRunner.query(`ALTER TABLE "decommission_logs" DROP CONSTRAINT "FK_72a7c94eab4a17fa66a0c3568f0"`);
        await queryRunner.query(`ALTER TABLE "decommission_logs" DROP CONSTRAINT "FK_e56717838b141de03738ed5a2a0"`);
        await queryRunner.query(`ALTER TABLE "remote_access_logs" DROP CONSTRAINT "FK_32362b38b38f1c18398a684075a"`);
        await queryRunner.query(`ALTER TABLE "ota_jobs" DROP CONSTRAINT "FK_54cc40d921c4bf6fba629bd461f"`);
        await queryRunner.query(`ALTER TABLE "meters" DROP CONSTRAINT "FK_9a86d6d705ad4883f3f0e9cb0bf"`);
        await queryRunner.query(`ALTER TABLE "meter_otps" DROP CONSTRAINT "FK_6850880a34ca1ed408bd9ee6bb2"`);
        await queryRunner.query(`ALTER TABLE "meter_assignments" DROP CONSTRAINT "FK_5b32e3c3fb5be83fad32d957459"`);
        await queryRunner.query(`ALTER TABLE "meter_assignments" DROP CONSTRAINT "FK_8865870f499ac8cbde4e38cbd99"`);
        await queryRunner.query(`ALTER TABLE "preregistered_contacts" DROP CONSTRAINT "FK_65b61cb616a265e598a8d3844ac"`);
        await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_415e47bfa95b7897c35bdca6421"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a58b4281deada1f4c0956a18c"`);
        await queryRunner.query(`DROP TABLE "decommission_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c7d6add171bbd86b834e9e085e"`);
        await queryRunner.query(`DROP TABLE "event_mapping"`);
        await queryRunner.query(`DROP INDEX "public"."idx_meter_channels_device_timestamp"`);
        await queryRunner.query(`DROP TABLE "meter_channels"`);
        await queryRunner.query(`DROP TABLE "remote_access_logs"`);
        await queryRunner.query(`DROP TABLE "ota_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."ota_jobs_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3cc64181e9df93a83bec8ebc7a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f70f06763ef8050d1cf726ce6"`);
        await queryRunner.query(`DROP TABLE "iot_meters"`);
        await queryRunner.query(`DROP TYPE "public"."iot_meters_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a86d6d705ad4883f3f0e9cb0b"`);
        await queryRunner.query(`DROP TABLE "meters"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6850880a34ca1ed408bd9ee6bb"`);
        await queryRunner.query(`DROP TABLE "meter_otps"`);
        await queryRunner.query(`DROP TABLE "households"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b32e3c3fb5be83fad32d95745"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8865870f499ac8cbde4e38cbd9"`);
        await queryRunner.query(`DROP TABLE "meter_assignments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65b61cb616a265e598a8d3844a"`);
        await queryRunner.query(`DROP TABLE "preregistered_contacts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5b3122ec05edd36137e0afb39"`);
        await queryRunner.query(`DROP TABLE "members"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5a6ad5d1dc980d07d07969525"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_677f1dbebfe5223c39d15f229e"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4542dd2f38a61354a040ba9fd5"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
