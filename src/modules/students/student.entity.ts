import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from '@marka/modules/tenants';
import { School } from '@marka/modules/schools/school.entity';
import { Assessment } from '@marka/modules/assessments';
import { Report } from '@marka/modules/reports';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
  TRANSFERRED = 'transferred',
  SUSPENDED = 'suspended',
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  lin: string; // Learner Identification Number

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  placeOfBirth: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  parentName: string;

  @Column({ nullable: true })
  parentPhone: string;

  @Column({ nullable: true })
  parentEmail: string;

  @Column({ nullable: true })
  class: string;

  @Column({ nullable: true })
  stream: string;

  @Column({
    type: 'enum',
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  status: StudentStatus;

  @Column({ type: 'date', nullable: true })
  admissionDate: Date;

  @Column({ type: 'date', nullable: true })
  graduationDate: Date;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  medicalInfo: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  additionalInfo: Record<string, any>;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.id)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  schoolId: string;

  @ManyToOne(() => School, (school) => school.students)
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @OneToMany(() => Assessment, (assessment) => assessment.student)
  assessments: Assessment[];

  @OneToMany(() => Report, (report) => report.student)
  reports: Report[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}