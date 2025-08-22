import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1620000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "subdomain" varchar NOT NULL,
        "api_key" varchar UNIQUE,
        "plan" varchar NOT NULL DEFAULT 'standard',
        "isolation_mode" varchar NOT NULL DEFAULT 'rls',
        "schema_name" varchar,
        "is_active" boolean NOT NULL DEFAULT true,
        "logo_url" varchar,
        "primary_color" varchar,
        "secondary_color" varchar,
        "contact_email" varchar,
        "contact_phone" varchar,
        "settings" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create unique index on subdomain
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tenants_subdomain" ON "tenants"("subdomain")`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL,
        "password" varchar NOT NULL,
        "refresh_token_hash" varchar,
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "phone" varchar,
        "role" varchar NOT NULL DEFAULT 'teacher',
        "is_active" boolean NOT NULL DEFAULT true,
        "tenant_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create unique index on email
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users"("email")`);

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    // Create schools table
    await queryRunner.query(`
      CREATE TABLE "schools" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "code" varchar,
        "level" varchar NOT NULL DEFAULT 'primary',
        "address" varchar,
        "city" varchar,
        "district" varchar,
        "region" varchar,
        "postal_code" varchar,
        "phone" varchar,
        "email" varchar,
        "website" varchar,
        "logo_url" varchar,
        "settings" jsonb,
        "tenant_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "schools" 
      ADD CONSTRAINT "FK_schools_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    // Create students table
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "lin" varchar NOT NULL,
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "middle_name" varchar,
        "gender" varchar,
        "date_of_birth" date,
        "place_of_birth" varchar,
        "address" varchar,
        "phone" varchar,
        "email" varchar,
        "parent_name" varchar,
        "parent_phone" varchar,
        "parent_email" varchar,
        "class" varchar,
        "stream" varchar,
        "status" varchar NOT NULL DEFAULT 'active',
        "admission_date" date,
        "graduation_date" date,
        "photo_url" varchar,
        "medical_info" jsonb,
        "additional_info" jsonb,
        "tenant_id" uuid NOT NULL,
        "school_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create unique index on lin
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_students_lin" ON "students"("lin")`);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "students" 
      ADD CONSTRAINT "FK_students_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "students" 
      ADD CONSTRAINT "FK_students_school" 
      FOREIGN KEY ("school_id") 
      REFERENCES "schools"("id") 
      ON DELETE SET NULL
    `);

    // Create subjects table
    await queryRunner.query(`
      CREATE TABLE "subjects" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "code" varchar NOT NULL,
        "description" varchar,
        "type" varchar NOT NULL DEFAULT 'core',
        "exam_level" varchar NOT NULL,
        "is_compulsory" boolean NOT NULL DEFAULT false,
        "grading_criteria" jsonb,
        "tenant_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create unique index on code
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_subjects_code" ON "subjects"("code")`);

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD CONSTRAINT "FK_subjects_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    // Create assessments table
    await queryRunner.query(`
      CREATE TABLE "assessments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "type" varchar NOT NULL,
        "exam_level" varchar NOT NULL,
        "ca_score" decimal(5,2),
        "exam_score" decimal(5,2),
        "total_score" decimal(5,2),
        "grade" varchar,
        "points" integer,
        "remark" varchar,
        "metadata" jsonb,
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "assessments" 
      ADD CONSTRAINT "FK_assessments_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "assessments" 
      ADD CONSTRAINT "FK_assessments_student" 
      FOREIGN KEY ("student_id") 
      REFERENCES "students"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "assessments" 
      ADD CONSTRAINT "FK_assessments_subject" 
      FOREIGN KEY ("subject_id") 
      REFERENCES "subjects"("id") 
      ON DELETE CASCADE
    `);

    // Create report templates table
    await queryRunner.query(`
      CREATE TABLE "report_templates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "code" varchar NOT NULL,
        "description" varchar,
        "tier_required" varchar NOT NULL,
        "config" jsonb NOT NULL,
        "thumbnail_url" varchar,
        "tenant_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create unique index on code
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_report_templates_code" ON "report_templates"("code")`);

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "report_templates" 
      ADD CONSTRAINT "FK_report_templates_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    // Create reports table
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "report_no" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "exam_level" varchar NOT NULL,
        "results" jsonb,
        "pdf_url" varchar,
        "metadata" jsonb,
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "template_id" uuid NOT NULL,
        "report_date" date NOT NULL,
        "term_start_date" date,
        "term_end_date" date,
        "academic_year" varchar,
        "term" varchar,
        "class_teacher" varchar,
        "head_teacher" varchar,
        "error_message" varchar,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create unique index on report_no
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_reports_report_no" ON "reports"("report_no")`);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_student" 
      FOREIGN KEY ("student_id") 
      REFERENCES "students"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reports" 
      ADD CONSTRAINT "FK_reports_template" 
      FOREIGN KEY ("template_id") 
      REFERENCES "report_templates"("id") 
      ON DELETE CASCADE
    `);

    // Create import jobs table
    await queryRunner.query(`
      CREATE TABLE "import_jobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "file_name" varchar NOT NULL,
        "file_size" integer NOT NULL,
        "type" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "result" jsonb,
        "error_message" varchar,
        "download_url" varchar,
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "completed_at" timestamp
      )
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "import_jobs" 
      ADD CONSTRAINT "FK_import_jobs_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "import_jobs" 
      ADD CONSTRAINT "FK_import_jobs_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "plan" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "billing_cycle" varchar NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "discount" decimal(10,2),
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "trial_end_date" date,
        "payment_reference" varchar,
        "metadata" jsonb,
        "tenant_id" uuid NOT NULL,
        "provider_subscription_id" varchar,
        "next_billing_date" timestamp,
        "cancelled_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "reference" varchar NOT NULL,
        "provider" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "type" varchar NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "fee" decimal(10,2),
        "metadata" jsonb,
        "tenant_id" uuid NOT NULL,
        "subscription_id" uuid,
        "paid_at" timestamp,
        "refunded_at" timestamp,
        "provider_payment_id" varchar,
        "provider_response" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create unique index on reference
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_payments_reference" ON "payments"("reference")`);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "payments" 
      ADD CONSTRAINT "FK_payments_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "payments" 
      ADD CONSTRAINT "FK_payments_subscription" 
      FOREIGN KEY ("subscription_id") 
      REFERENCES "subscriptions"("id") 
      ON DELETE SET NULL
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "content" varchar NOT NULL,
        "type" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "category" varchar NOT NULL,
        "recipient" varchar,
        "metadata" jsonb,
        "tenant_id" uuid NOT NULL,
        "user_id" uuid,
        "sent_at" timestamp,
        "delivered_at" timestamp,
        "read_at" timestamp,
        "provider_response" varchar,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "FK_notifications_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "FK_notifications_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);

    // Create audit logs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "action" varchar NOT NULL,
        "entity" varchar NOT NULL,
        "entity_id" varchar,
        "old_values" jsonb,
        "new_values" jsonb,
        "metadata" jsonb,
        "tenant_id" uuid NOT NULL,
        "user_id" uuid,
        "user_agent" varchar,
        "ip_address" varchar,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD CONSTRAINT "FK_audit_logs_tenant" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD CONSTRAINT "FK_audit_logs_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);

    // Create composite indexes for performance
    await queryRunner.query(`CREATE INDEX "IDX_users_tenant_role" ON "users"("tenant_id", "role")`);
    await queryRunner.query(`CREATE INDEX "IDX_students_tenant_school" ON "students"("tenant_id", "school_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assessments_tenant_student" ON "assessments"("tenant_id", "student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assessments_tenant_subject" ON "assessments"("tenant_id", "subject_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_tenant_student" ON "reports"("tenant_id", "student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_tenant_user" ON "audit_logs"("tenant_id", "user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_tenant_action" ON "audit_logs"("tenant_id", "action")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_tenant_entity" ON "audit_logs"("tenant_id", "entity")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "import_jobs"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TABLE "report_templates"`);
    await queryRunner.query(`DROP TABLE "assessments"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "schools"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}