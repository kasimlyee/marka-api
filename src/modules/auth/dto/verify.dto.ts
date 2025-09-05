import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsArray } from 'class-validator';
import { VerificationType } from '../../verification/verification.enum';

export class VerifyEmailDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Verification token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Verification token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResendVerificationDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: VerificationType, description: 'Verification type' })
  @IsEnum(VerificationType)
  type: VerificationType;

  @ApiProperty({ description: 'Verification token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class BulkVerificationStatusDto {
  @ApiProperty({ type: [String], description: 'Array of user IDs' })
  @IsArray()
  @IsNotEmpty({ each: true })
  userIds: string[];
}
