import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { TenantResponseDto } from '../../tenants/dto/tenant-response.dto';

export class RegisterResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  @Type(() => TenantResponseDto)
  tenant: TenantResponseDto;

  @Expose()
  message: string;

  constructor(partial: Partial<RegisterResponseDto>) {
    Object.assign(this, partial);
  }
}
