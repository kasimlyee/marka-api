import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '@marka/modules/tenants';
import { Student } from '@marka/modules/students';
import { ReportTemplate } from './report-template.entity';

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExamLevel {
  PLE = 'ple',
  UCE = 'uce',
  UACE = 'uace',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  reportNo: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({
    type: 'enum',
    enum: ExamLevel,
  })
  examLevel: ExamLevel;

  @Column({ type: 'jsonb', nullable: true })
  results: Record<string, any>;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.id)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (student) => student.reports)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'uuid' })
  templateId: string;

  @ManyToOne(() => ReportTemplate, (template) => template.reports)
  @JoinColumn({ name: 'templateId' })
  template: ReportTemplate;

  @Column({ type: 'date' })
  reportDate: Date;

  @Column({ type: 'date', nullable: true })
  termStartDate: Date;

  @Column({ type: 'date', nullable: true })
  termEndDate: Date;

  @Column({ nullable: true })
  academicYear: string;

  @Column({ nullable: true })
  term: string;

  @Column({ nullable: true })
  classTeacher: string;

  @Column({ nullable: true })
  headTeacher: string;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
