import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { School } from '../../schools/school.entity';
import { User } from '../../users/user.entity';
import { ExamLevel } from '../../assessments/assessment.entity';

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('report_card_templates')
export class ReportCardTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ExamLevel,
  })
  examLevel: ExamLevel;

  @Column({ type: 'text' })
  htmlTemplate: string;

  @Column({ type: 'jsonb', nullable: true })
  styles: any; // CSS styles

  @Column({ type: 'jsonb', nullable: true })
  configuration: any; // Template configuration

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'uuid', nullable: true })
  schoolId: string; // null for system templates

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}
