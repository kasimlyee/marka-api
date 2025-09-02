import { IsEnum, IsInt, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExamLevel } from '../../assessments/assessment.entity';

export class GenerateReportCardDto {
  @ApiProperty({ description: 'Student IDs' })
  @IsUUID(undefined, { each: true })
  studentIds: string[];

  @ApiProperty({ enum: ExamLevel, description: 'Exam level' })
  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @ApiProperty({ description: 'Term number' })
  @IsInt()
  term: number;

  @ApiProperty({ description: 'Academic year' })
  @IsInt()
  year: number;

  @ApiProperty({ description: 'Template ID' })
  @IsUUID()
  templateId: string;
}
