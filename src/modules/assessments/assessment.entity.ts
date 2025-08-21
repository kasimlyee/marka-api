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
import { Subject } from '@marka/modules/subjects';

export enum AssessmentType {
  EXAM = 'exam',
  TEST = 'test',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  PROJECT = 'project',
  PRACTICAL = 'practical',
}

export enum ExamLevel {
  PLE = 'ple',
  UCE = 'uce',
  UACE = 'uace',
}

export enum Grade {
  // PLE Grades
  D1 = 'D1',
  D2 = 'D2',
  C3 = 'C3',
  C4 = 'C4',
  C5 = 'C5',
  C6 = 'C6',
  P7 = 'P7',
  P8 = 'P8',
  F9 = 'F9',

  // UCE and UACE Grades
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  O = 'O',
  F = 'F',
}

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  name: string;

  @Column({
    type: 'enum',
    enum: AssessmentType,
  })
  type: AssessmentType;

  @Column({
    type: 'enum',
    enum: ExamLevel,
  })
  examLevel: ExamLevel;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  caScore: number; // Continuous Assessment score

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  examScore: number; // Final exam score

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  totalScore: number; // Combined score

  @Column({
    type: 'enum',
    enum: Grade,
    nullable: true,
  })
  grade: Grade;

  @Column({ type: 'int', nullable: true })
  points: number; // For UACE grading

  @Column({ nullable: true })
  remark: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.id)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (student) => student.assessments)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'uuid' })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.assessments)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
