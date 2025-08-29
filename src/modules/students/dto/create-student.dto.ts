import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsISO8601,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, StudentStatus } from '../student.entity';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Learner Identification Number',
    required: false,
  })
  @IsOptional()
  @IsString()
  lin?: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Middle name', required: false })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Date of birth in YYYY-MM-DD format',
    required: false,
    example: '2012-08-29',
  })
  @IsOptional()
  @IsISO8601({ strict: true }) // Use IsISO8601 instead of IsDateString
  dateOfBirth?: string; // Use string instead of Date

  @ApiProperty({ description: 'Place of birth', required: false })
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @ApiProperty({ description: 'Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsPhoneNumber() // Use proper phone validation
  phone?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Parent name', required: false })
  @IsOptional()
  @IsString()
  parentName?: string;

  @ApiProperty({ description: 'Parent phone', required: false })
  @IsOptional()
  @IsPhoneNumber()
  parentPhone?: string;

  @ApiProperty({ description: 'Parent email', required: false })
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiProperty({ description: 'Class', required: false })
  @IsOptional()
  @IsString()
  class?: string;

  @ApiProperty({ description: 'Stream', required: false })
  @IsOptional()
  @IsString()
  stream?: string;

  @ApiProperty({
    description: 'Student status',
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiProperty({
    description: 'Admission date in YYYY-MM-DD format',
    required: false,
    example: '2025-08-29',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  admissionDate?: string;

  @ApiProperty({
    description: 'Graduation date in YYYY-MM-DD format',
    required: false,
    example: '2025-08-29',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  graduationDate?: string;

  @ApiProperty({ description: 'Photo URL', required: false })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ description: 'School ID', required: false })
  @IsOptional()
  @IsString()
  schoolId?: string;
}
