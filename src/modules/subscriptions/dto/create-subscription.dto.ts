import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { BillingCycle, SubscriptionStatus } from '../subscription.entity';
import { TenantPlan } from '@marka/common';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: TenantPlan, enumName: 'SubscriptionPlan' })
  @IsNotEmpty()
  @IsEnum(TenantPlan)
  plan: TenantPlan;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  stripeSubscriptionId?: string;

  @IsNumber()
  amount: number;

  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}
