import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';
import { TenantPlan } from '../tenant.entity';

export class CreateTenantDto {
  @ApiProperty({ description: 'Name of the tenant/school' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Subdomain for the tenant' })
  @IsString()
  subdomain: string;

  @ApiProperty({
    description: 'Subscription plan',
    enum: TenantPlan,
    default: TenantPlan.STANDARD,
  })
  @IsEnum(TenantPlan)
  plan: TenantPlan;

  @ApiProperty({ description: 'Contact email', required: false })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ description: 'Contact phone', required: false })
  @IsOptional()
  @IsPhoneNumber('UG')
  contactPhone?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ description: 'Primary color for branding', required: false })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ description: 'Secondary color for branding', required: false })
  @IsOptional()
  @IsString()
  secondaryColor?: string;
}