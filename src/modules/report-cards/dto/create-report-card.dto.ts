import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExamLevel } from '../../assessments/assessment.entity';
import { ReportCardType } from '../entities/report-card.entity';

export class CreateReportCardDto {
  @ApiProperty({ description: 'Report card title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: ReportCardType, description: 'Report card type' })
  @IsEnum(ReportCardType)
  type: ReportCardType;

  @ApiProperty({ enum: ExamLevel, description: 'Exam level' })
  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @ApiProperty({ description: 'Term number (1, 2, or 3)' })
  @IsInt()
  term: number;

  @ApiProperty({ description: 'Academic year' })
  @IsInt()
  year: number;

  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Template ID' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Head teacher comment', required: false })
  @IsOptional()
  @IsString()
  headTeacherComment?: string;

  @ApiProperty({ description: 'Class teacher comment', required: false })
  @IsOptional()
  @IsString()
  classTeacherComment?: string;

  @ApiProperty({ description: 'Next term begins date', required: false })
  @IsOptional()
  @IsDateString()
  nextTermBegins?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: any;
}
