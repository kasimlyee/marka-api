import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRowLevelSecurity1620000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable Row Level Security
    await queryRunner.query(`ALTER DATABASE "${process.env.DB_NAME || 'marka'}" SET default_row_security = on`);

    // Create app settings for tenant context
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS app`);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app.current_tenant_id() 
      RETURNS uuid AS $$
      BEGIN
        RETURN current_setting('app.tenant_id', true)::uuid;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Enable RLS on all tables with tenant_id
    const tables = [
      'users',
      'schools',
      'students',
      'subjects',
      'assessments',
      'report_templates',
      'reports',
      'import_jobs',
      'subscriptions',
      'payments',
      'notifications',
      'audit_logs'
    ];

    for (const table of tables) {
      // Enable RLS
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);

      // Create tenant isolation policy
      await queryRunner.query(`
        CREATE POLICY tenant_isolation ON "${table}"
        USING (tenant_id = app.current_tenant_id())
      `);

      // Create policy to allow superusers to access all data
      await queryRunner.query(`
        CREATE POLICY superuser_access ON "${table}"
        USING (current_user = 'postgres')
      `);
    }

    // Create specific policies for special cases

    // Policy for users to only see users in their tenant
    await queryRunner.query(`
      CREATE POLICY tenant_users ON "users"
      USING (tenant_id = app.current_tenant_id())
    `);

    // Policy for students to only see their own data
    await queryRunner.query(`
      CREATE POLICY student_self_access ON "students"
      USING (tenant_id = app.current_tenant_id())
    `);

    // Policy for students to only see their own assessments
    await queryRunner.query(`
      CREATE POLICY student_assessments ON "assessments"
      USING (tenant_id = app.current_tenant_id())
    `);

    // Policy for students to only see their own reports
    await queryRunner.query(`
      CREATE POLICY student_reports ON "reports"
      USING (tenant_id = app.current_tenant_id())
    `);

    // Create a function to set the tenant context
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app.set_tenant_id(tenant_id uuid) 
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.tenant_id', tenant_id::text, true);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create a function to reset the tenant context
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app.reset_tenant_id() 
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.tenant_id', '', true);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create a trigger function to automatically set tenant_id on insert
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION app.set_tenant_id_on_insert() 
      RETURNS trigger AS $$
      BEGIN
        IF NEW.tenant_id IS NULL THEN
          NEW.tenant_id = app.current_tenant_id();
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Apply the trigger to all tables with tenant_id
    for (const table of tables) {
      await queryRunner.query(`
        CREATE TRIGGER set_${table}_tenant_id
        BEFORE INSERT ON "${table}"
        FOR EACH ROW
        EXECUTE FUNCTION app.set_tenant_id_on_insert();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all triggers
    const tables = [
      'users',
      'schools',
      'students',
      'subjects',
      'assessments',
      'report_templates',
      'reports',
      'import_jobs',
      'subscriptions',
      'payments',
      'notifications',
      'audit_logs'
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS set_${table}_tenant_id ON "${table}"`);
    }

    // Drop functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS app.set_tenant_id_on_insert()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app.reset_tenant_id()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app.set_tenant_id(uuid)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app.current_tenant_id()`);

    // Drop policies
    for (const table of tables) {
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON "${table}"`);
      await queryRunner.query(`DROP POLICY IF EXISTS superuser_access ON "${table}"`);
    }

    await queryRunner.query(`DROP POLICY IF EXISTS tenant_users ON "users"`);
    await queryRunner.query(`DROP POLICY IF EXISTS student_self_access ON "students"`);
    await queryRunner.query(`DROP POLICY IF EXISTS student_assessments ON "assessments"`);
    await queryRunner.query(`DROP POLICY IF EXISTS student_reports ON "reports"`);

    // Disable RLS
    for (const table of tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }

    // Drop app schema
    await queryRunner.query(`DROP SCHEMA IF EXISTS app CASCADE`);

    // Disable Row Level Security for the database
    await queryRunner.query(`ALTER DATABASE "${process.env.DB_NAME || 'marka'}" SET default_row_security = off`);
  }
}