import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsEmail, IsUrl } from 'class-validator';
import { SchoolLevel } from '../school.entity';

export class CreateSchoolDto {
  @ApiProperty({ description: 'School name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'School code', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'School level',
    enum: SchoolLevel,
    default: SchoolLevel.PRIMARY,
  })
  @IsEnum(SchoolLevel)
  level: SchoolLevel;

  @ApiProperty({ description: 'School address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'District', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ description: 'Region', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'Postal code', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Website URL', required: false })
  @IsUrl()
  website?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsUrl()
  logoUrl?: string;
}