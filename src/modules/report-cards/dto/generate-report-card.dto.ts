import { IsString, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ExamLevel } from '../entities/report-card-template.entity';

export class GenerateReportCardDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  templateId: string;

  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @IsString()
  academicYear: string;

  @IsString()
  term: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class BulkGenerateReportCardDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  studentIds: string[];

  @IsUUID()
  templateId: string;

  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @IsString()
  academicYear: string;

  @IsString()
  term: string;

  @IsOptional()
  @IsString()
  title?: string;
}
