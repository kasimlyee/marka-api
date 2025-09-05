import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedVerificationStatus1757080639406 implements MigrationInterface {
    name = 'AddedVerificationStatus1757080639406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."verifications_type_enum" AS ENUM('email', 'phone', 'two_factor', 'password_reset')`);
        await queryRunner.query(`CREATE TYPE "public"."verifications_status_enum" AS ENUM('pending', 'verified', 'expired', 'failed')`);
        await queryRunner.query(`CREATE TABLE "verifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."verifications_type_enum" NOT NULL, "status" "public"."verifications_status_enum" NOT NULL DEFAULT 'pending', "code" character varying NOT NULL, "token" character varying, "target" character varying(255) NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "verifiedAt" TIMESTAMP, "expiresAt" TIMESTAMP, "userId" uuid NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2127ad1b143cf012280390b01d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "verifications" ADD CONSTRAINT "FK_e6a542673f9abc1f67e5f32abaf" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verifications" DROP CONSTRAINT "FK_e6a542673f9abc1f67e5f32abaf"`);
        await queryRunner.query(`DROP TABLE "verifications"`);
        await queryRunner.query(`DROP TYPE "public"."verifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."verifications_type_enum"`);
    }

}
