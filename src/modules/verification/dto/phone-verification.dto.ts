import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class PhoneVerificationDto {
  @IsPhoneNumber('UG')
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
