import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Student } from '../../students/student.entity';
import { School } from '../../schools/school.entity';
import { User } from '../../users/user.entity';
import { ExamLevel } from '../../assessments/assessment.entity';
import { ReportCardTemplate } from './report-card-template.entity';

export enum ReportCardStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportCardType {
  TERMLY = 'termly',
  ANNUAL = 'annual',
  FINAL = 'final',
}

@Entity('report_cards')
@Index(['studentId', 'examLevel', 'term', 'year'], { unique: true })
export class ReportCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: ReportCardType,
    default: ReportCardType.TERMLY,
  })
  type: ReportCardType;

  @Column({
    type: 'enum',
    enum: ExamLevel,
  })
  examLevel: ExamLevel;

  @Column({ type: 'int' })
  term: number; // 1, 2, or 3

  @Column({ type: 'int' })
  year: number;

  @Column({
    type: 'enum',
    enum: ReportCardStatus,
    default: ReportCardStatus.DRAFT,
  })
  status: ReportCardStatus;

  @Column({ type: 'text', nullable: true })
  pdfPath: string;

  @Column({ type: 'text', nullable: true })
  htmlContent: string;

  @Column({ type: 'jsonb', nullable: true })
  results: any; // Computed results from grading service

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'text', nullable: true })
  headTeacherComment: string;

  @Column({ type: 'text', nullable: true })
  classTeacherComment: string;

  @Column({ type: 'date', nullable: true })
  nextTermBegins: Date;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  templateId: string;

  @Column({ type: 'uuid', nullable: true })
  generatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @ManyToOne(() => School, { eager: true })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @ManyToOne(() => ReportCardTemplate, { eager: true })
  @JoinColumn({ name: 'templateId' })
  template: ReportCardTemplate;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generatedBy' })
  generator: User;
}
