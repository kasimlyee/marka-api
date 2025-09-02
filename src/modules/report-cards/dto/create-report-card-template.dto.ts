import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExamLevel } from '../../assessments/assessment.entity';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Template description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ExamLevel, description: 'Exam level' })
  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @ApiProperty({ description: 'HTML template content' })
  @IsString()
  @IsNotEmpty()
  htmlTemplate: string;

  @ApiProperty({ description: 'CSS styles', required: false })
  @IsOptional()
  styles?: any;

  @ApiProperty({ description: 'Template configuration', required: false })
  @IsOptional()
  configuration?: any;
}
