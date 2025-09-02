import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Student } from '../../students/student.entity';
import { School } from '../../schools/school.entity';
import { ReportCardTemplate, ExamLevel } from './report-card-template.entity';

export enum ReportCardStatus {
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

@Entity('report_cards')
@Index(['studentId', 'examLevel', 'academicYear', 'term'])
@Index(['schoolId', 'status'])
@Index(['generatedAt'])
export class ReportCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'enum', enum: ExamLevel })
  examLevel: ExamLevel;

  @Column({ type: 'varchar', length: 50 })
  academicYear: string;

  @Column({ type: 'varchar', length: 50 })
  term: string;

  @Column({ type: 'text' })
  pdfPath: string; // Path to the generated PDF file

  @Column({ type: 'text', nullable: true })
  pdfUrl: string; // Public URL for the PDF (if using cloud storage)

  @Column({
    type: 'enum',
    enum: ReportCardStatus,
    default: ReportCardStatus.GENERATING,
  })
  status: ReportCardStatus;

  @Column({ type: 'jsonb', nullable: true })
  reportData: Record<string, any>; // Calculated grades, statistics, etc.

  @Column({ type: 'text', nullable: true })
  generatedHtml: string; // Store the generated HTML for debugging

  @Column({ type: 'varchar', length: 100, nullable: true })
  fileSize: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student: Student;

  @Column({ type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  school: School;

  @Column({ type: 'uuid' })
  templateId: string;

  @ManyToOne(() => ReportCardTemplate, { onDelete: 'RESTRICT' })
  template: ReportCardTemplate;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  generatedBy: string;
}
