import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedReportCards1756810065761 implements MigrationInterface {
    name = 'AddedReportCards1756810065761'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."report_card_templates_examlevel_enum" AS ENUM('ple', 'uce', 'uace')`);
        await queryRunner.query(`CREATE TYPE "public"."report_card_templates_status_enum" AS ENUM('draft', 'active', 'archived')`);
        await queryRunner.query(`CREATE TABLE "report_card_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "htmlTemplate" text NOT NULL, "templateVariables" jsonb, "styling" jsonb, "examLevel" "public"."report_card_templates_examlevel_enum" NOT NULL, "status" "public"."report_card_templates_status_enum" NOT NULL DEFAULT 'draft', "isDefault" boolean NOT NULL DEFAULT false, "version" character varying(100), "metadata" jsonb, "schoolId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" uuid, "updatedBy" uuid, CONSTRAINT "PK_ec7b3daa07fce641706aca4eaf2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9034aff37ec4e913b3e9fc259b" ON "report_card_templates" ("isDefault", "examLevel") `);
        await queryRunner.query(`CREATE INDEX "IDX_9c1811c8f2a9e50a39241bf986" ON "report_card_templates" ("schoolId", "examLevel", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."report_cards_examlevel_enum" AS ENUM('ple', 'uce', 'uace')`);
        await queryRunner.query(`CREATE TYPE "public"."report_cards_status_enum" AS ENUM('generating', 'completed', 'failed', 'archived')`);
        await queryRunner.query(`CREATE TABLE "report_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "examLevel" "public"."report_cards_examlevel_enum" NOT NULL, "academicYear" character varying(50) NOT NULL, "term" character varying(50) NOT NULL, "pdfPath" text NOT NULL, "pdfUrl" text, "status" "public"."report_cards_status_enum" NOT NULL DEFAULT 'generating', "reportData" jsonb, "generatedHtml" text, "fileSize" character varying(100), "errorMessage" text, "metadata" jsonb, "studentId" uuid NOT NULL, "schoolId" uuid NOT NULL, "templateId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "generatedAt" TIMESTAMP, "generatedBy" uuid, CONSTRAINT "PK_ad580db1af279fb14a78f4eb274" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_11406db40c956ac87e69df86b8" ON "report_cards" ("generatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_ee601de07b382a7b593ea4e0b4" ON "report_cards" ("schoolId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c29106bac28a17b27d8a827123" ON "report_cards" ("studentId", "examLevel", "academicYear", "term") `);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('pending', 'active', 'inactive', 'suspended', 'deleted')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isPhoneVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneVerifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginIp" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "twoFactorEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "twoFactorSecret" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "twoFactorRecoveryCodes" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "IDX_a000cca60bcf04454e72769949" ON "users" ("phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_8fab41eff1378936fb0d4230ce" ON "users" ("phone", "deletedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_c4dd678058708647766157c6e4" ON "users" ("email", "deletedAt") `);
        await queryRunner.query(`ALTER TABLE "report_card_templates" ADD CONSTRAINT "FK_e63780eeb33a5342b982f3981ce" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report_cards" ADD CONSTRAINT "FK_435d59076f1c15d98035b7cd1dd" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report_cards" ADD CONSTRAINT "FK_fc7486a405f43c6ef24d4d95903" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "report_cards" ADD CONSTRAINT "FK_6c7105fa9c244cb2dbe96f4cfb5" FOREIGN KEY ("templateId") REFERENCES "report_card_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "report_cards" DROP CONSTRAINT "FK_6c7105fa9c244cb2dbe96f4cfb5"`);
        await queryRunner.query(`ALTER TABLE "report_cards" DROP CONSTRAINT "FK_fc7486a405f43c6ef24d4d95903"`);
        await queryRunner.query(`ALTER TABLE "report_cards" DROP CONSTRAINT "FK_435d59076f1c15d98035b7cd1dd"`);
        await queryRunner.query(`ALTER TABLE "report_card_templates" DROP CONSTRAINT "FK_e63780eeb33a5342b982f3981ce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c4dd678058708647766157c6e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fab41eff1378936fb0d4230ce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a000cca60bcf04454e72769949"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twoFactorRecoveryCodes"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twoFactorSecret"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twoFactorEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginIp"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneVerifiedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerifiedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isPhoneVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isEmailVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c29106bac28a17b27d8a827123"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee601de07b382a7b593ea4e0b4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11406db40c956ac87e69df86b8"`);
        await queryRunner.query(`DROP TABLE "report_cards"`);
        await queryRunner.query(`DROP TYPE "public"."report_cards_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."report_cards_examlevel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c1811c8f2a9e50a39241bf986"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9034aff37ec4e913b3e9fc259b"`);
        await queryRunner.query(`DROP TABLE "report_card_templates"`);
        await queryRunner.query(`DROP TYPE "public"."report_card_templates_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."report_card_templates_examlevel_enum"`);
    }

}
