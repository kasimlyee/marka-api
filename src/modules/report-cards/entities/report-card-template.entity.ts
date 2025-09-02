import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { School } from '../../schools/school.entity';
import { ReportCard } from './report-card.entity';

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

export enum ExamLevel {
  PLE = 'ple',
  UCE = 'uce',
  UACE = 'uace'
}

@Entity('report_card_templates')
@Index(['schoolId', 'examLevel', 'status'])
@Index(['isDefault', 'examLevel'])
export class ReportCardTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  htmlTemplate: string; // HTML template with placeholders

  @Column({ type: 'jsonb', nullable: true })
  templateVariables: Record<string, any>; // Available variables for the template

  @Column({ type: 'jsonb', nullable: true })
  styling: Record<string, any>; // CSS styles, colors, fonts, etc.

  @Column({ type: 'enum', enum: ExamLevel })
  examLevel: ExamLevel;

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.DRAFT })
  status: TemplateStatus;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  version: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  school: School;

  @OneToMany(() => ReportCard, reportCard => reportCard.template)
  reportCards: ReportCard[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
}