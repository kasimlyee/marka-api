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
import { Tenant } from '../tenants/tenant.entity';
import { Assessment } from '../assessments/assessment.entity';

export enum SubjectType {
  CORE = 'core',
  ELECTIVE = 'elective',
  OPTIONAL = 'optional',
}

export enum ExamLevel {
  PLE = 'ple',
  UCE = 'uce',
  UACE = 'uace',
}

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  name: string;

  @Column({ unique: true })
  @Index()
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SubjectType,
    default: SubjectType.CORE,
  })
  type: SubjectType;

  @Column({
    type: 'enum',
    enum: ExamLevel,
  })
  examLevel: ExamLevel;

  @Column({ default: false })
  isCompulsory: boolean;

  @Column({ type: 'jsonb', nullable: true })
  gradingCriteria: Record<string, any>;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.id)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => Assessment, (assessment) => assessment.subject)
  assessments: Assessment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
