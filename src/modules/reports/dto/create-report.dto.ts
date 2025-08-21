import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ExamLevel } from '../report.entity';

export class CreateReportDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Template ID' })
  @IsUUID()
  templateId: string;

  @ApiProperty({
    description: 'Exam level',
    enum: ExamLevel,
  })
  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @ApiProperty({ description: 'Report date' })
  @IsDateString()
  reportDate: Date;

  @ApiProperty({ description: 'Term start date', required: false })
  @IsDateString()
  termStartDate?: Date;

  @ApiProperty({ description: 'Term end date', required: false })
  @IsDateString()
  termEndDate?: Date;

  @ApiProperty({ description: 'Academic year', required: false })
  @IsString()
  academicYear?: string;

  @ApiProperty({ description: 'Term', required: false })
  @IsString()
  term?: string;

  @ApiProperty({ description: 'Class teacher', required: false })
  @IsString()
  classTeacher?: string;

  @ApiProperty({ description: 'Head teacher', required: false })
  @IsString()
  headTeacher?: string;
}