import { IsEmail, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber('UG')
  @IsOptional()
  phone?: string;

  @IsEnum(VerificationType)
  type: VerificationType;
}