import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TenantPlan } from '@marka/common';

export enum IsolationMode {
  RLS = 'rls', // Row Level Security
  SCHEMA = 'schema', // Schema per tenant
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  name: string;

  @Column({ unique: true })
  @Index()
  subdomain: string;

  @Column({ unique: true, nullable: true })
  @Index()
  apiKey: string;

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.STANDARD,
  })
  plan: TenantPlan;

  @Column({
    type: 'enum',
    enum: IsolationMode,
    default: IsolationMode.RLS,
  })
  isolationMode: IsolationMode;

  @Column({ nullable: true })
  schemaName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  primaryColor: string;

  @Column({ nullable: true })
  secondaryColor: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('User', 'tenant')
  users: any[];

  @OneToMany('School', 'tenant')
  schools: any[];

  @OneToMany('Subscription', 'tenant')
  subscriptions: any[];
}
