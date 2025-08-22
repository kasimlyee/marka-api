import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { ActionType } from '../audit-log.entity';

export class CreateAuditLogDto {
  @ApiProperty({
    description: 'Action type',
    enum: ActionType,
  })
  @IsEnum(ActionType)
  action: ActionType;

  @ApiProperty({ description: 'Entity name' })
  @IsString()
  entity: string;

  @ApiProperty({ description: 'Entity ID', required: false })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Old values', required: false })
  @IsOptional()
  oldValues?: Record<string, any>;

  @ApiProperty({ description: 'New values', required: false })
  @IsOptional()
  newValues?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'User ID', required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'User agent', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'IP address', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
