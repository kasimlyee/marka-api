import { Exclude, Expose } from 'class-transformer';
import { TenantPlan } from '../../../common/enums/tenant-plan.enum';
import { IsolationMode } from '../tenant.entity';

export class TenantResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  subdomain: string;

  @Expose()
  plan: TenantPlan;

  @Expose()
  contactEmail: string;

  @Expose()
  logoUrl: string;

  @Expose()
  primaryColor: string;

  @Expose()
  secondaryColor: string;

  @Expose()
  contactPhone: string;

  @Expose()
  settings: Record<string, any>;

  @Expose()
  isolationMode: IsolationMode;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  apiKey: string;

  @Exclude()
  schemaName: string;

  constructor(partial: Partial<TenantResponseDto>) {
    Object.assign(this, partial);
  }
}
