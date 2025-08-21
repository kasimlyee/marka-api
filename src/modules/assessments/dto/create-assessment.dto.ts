import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { AssessmentType, ExamLevel } from '../assessment.entity';

export class CreateAssessmentDto {
  @ApiProperty({ description: 'Assessment name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Assessment type',
    enum: AssessmentType,
  })
  @IsEnum(AssessmentType)
  type: AssessmentType;

  @ApiProperty({
    description: 'Exam level',
    enum: ExamLevel,
  })
  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @ApiProperty({ description: 'Continuous Assessment score', required: false })
  @IsOptional()
  @IsNumber()
  caScore?: number;

  @ApiProperty({ description: 'Final exam score', required: false })
  @IsOptional()
  @IsNumber()
  examScore?: number;

  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ description: 'Remark', required: false })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}