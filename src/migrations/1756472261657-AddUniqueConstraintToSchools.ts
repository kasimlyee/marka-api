import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToSchools1756472261657 implements MigrationInterface {
    name = 'AddUniqueConstraintToSchools1756472261657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "schools" DROP CONSTRAINT "FK_f539bc33c6398e983cda7bda256"`);
        await queryRunner.query(`ALTER TABLE "schools" ADD CONSTRAINT "UQ_f539bc33c6398e983cda7bda256" UNIQUE ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_f539bc33c6398e983cda7bda25" ON "schools" ("tenantId") `);
        await queryRunner.query(`ALTER TABLE "schools" ADD CONSTRAINT "FK_f539bc33c6398e983cda7bda256" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "schools" DROP CONSTRAINT "FK_f539bc33c6398e983cda7bda256"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f539bc33c6398e983cda7bda25"`);
        await queryRunner.query(`ALTER TABLE "schools" DROP CONSTRAINT "UQ_f539bc33c6398e983cda7bda256"`);
        await queryRunner.query(`ALTER TABLE "schools" ADD CONSTRAINT "FK_f539bc33c6398e983cda7bda256" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
