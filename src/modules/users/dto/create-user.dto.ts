import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';
import { Role } from '@marka/common';

export class CreateUserDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsPhoneNumber('UG')
  phone?: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    default: Role.TEACHER,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsOptional()
  refreshTokenHash?: string;

  @ApiProperty({ description: 'Tenant ID' })
  @IsString()
  tenantId: string;
}
