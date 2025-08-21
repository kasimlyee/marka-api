import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsEmail, IsDateString } from 'class-validator';
import { Gender, StudentStatus } from '../student.entity';

export class CreateStudentDto {
  @ApiProperty({ description: 'Learner Identification Number', required: false })
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

  @ApiProperty({ description: 'Date of birth', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

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
  @IsString()
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
  @IsString()
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

  @ApiProperty({ description: 'Admission date', required: false })
  @IsOptional()
  @IsDateString()
  admissionDate?: Date;

  @ApiProperty({ description: 'Graduation date', required: false })
  @IsOptional()
  @IsDateString()
  graduationDate?: Date;

  @ApiProperty({ description: 'Photo URL', required: false })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ description: 'School ID', required: false })
  @IsOptional()
  @IsString()
  schoolId?: string;
}