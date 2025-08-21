import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { SubjectType, ExamLevel } from '../subject.entity';

export class CreateSubjectDto {
  @ApiProperty({ description: 'Subject name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Subject code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Subject description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Subject type',
    enum: SubjectType,
    default: SubjectType.CORE,
  })
  @IsEnum(SubjectType)
  type: SubjectType;

  @ApiProperty({
    description: 'Exam level',
    enum: ExamLevel,
  })
  @IsEnum(ExamLevel)
  examLevel: ExamLevel;

  @ApiProperty({
    description: 'Is subject compulsory',
    default: false,
  })
  @IsBoolean()
  isCompulsory: boolean;
}
