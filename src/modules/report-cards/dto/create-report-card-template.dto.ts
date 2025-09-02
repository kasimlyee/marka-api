import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';
import {
  ExamLevel,
  TemplateStatus,
} from '../entities/report-card-template.entity';

export class CreateReportCardTemplateDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  htmlTemplate: string;

  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, any>;

  @IsOptional()
  @IsObject()
  styling?: Record<string, any>;

  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  version?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
