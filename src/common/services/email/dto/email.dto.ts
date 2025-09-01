import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailAttachmentDto {
  @ApiProperty()
  @IsString()
  filename: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cid?: string;
}

export class SendEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { each: true })
  to: string | string[];

  @ApiPropertyOptional({ example: ['cc@example.com'] })
  @IsOptional()
  @IsEmail({}, { each: true })
  cc?: string | string[];

  @ApiPropertyOptional({ example: ['bcc@example.com'] })
  @IsOptional()
  @IsEmail({}, { each: true })
  bcc?: string | string[];

  @ApiProperty({ example: 'Welcome to our service!' })
  @IsString()
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'welcome' })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional()
  @IsOptional()
  templateData?: Record<string, any>;

  @ApiPropertyOptional({ type: [EmailAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];

  @ApiPropertyOptional({ enum: ['high', 'normal', 'low'] })
  @IsOptional()
  @IsEnum(['high', 'normal', 'low'])
  priority?: 'high' | 'normal' | 'low';

  @ApiPropertyOptional()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replyTo?: string;
}

export class ScheduleEmailDto extends SendEmailDto {
  @ApiProperty({ example: '2024-12-25T10:00:00Z' })
  @IsDateString()
  scheduleDate: string;
}

export class BulkEmailDto {
  @ApiProperty({ type: [SendEmailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendEmailDto)
  emails: SendEmailDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchName?: string;
}
