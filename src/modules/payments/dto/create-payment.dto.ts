import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { PaymentProvider, PaymentType, PaymentStatus } from '../payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment provider',
    enum: PaymentProvider,
  })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
  })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty({
    description: 'Payment Status',
    enum: PaymentStatus,
    required: false,
  })
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Payment metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
