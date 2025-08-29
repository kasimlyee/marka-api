import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './tenants.service';
import { TenantController } from './tenants.controller';
import { Tenant } from './tenant.entity';
import { TenantGuard } from './guard/tenant.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [TenantService, TenantGuard],
  exports: [TenantService, TenantGuard],
})
export class TenantsModule {}
