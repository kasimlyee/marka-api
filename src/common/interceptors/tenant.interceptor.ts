import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService, Tenant } from '@marka/modules/tenants';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  // Make constructor private to enforce factory usage
  private constructor(private readonly tenantService: TenantService) {}

  // Factory method
  static create(tenantService: TenantService): TenantInterceptor {
    return new TenantInterceptor(tenantService);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract tenant identifier from request
    const tenantIdentifier = this.extractTenantIdentifier(request);

    if (tenantIdentifier) {
      // Resolve tenant
      const tenant: Tenant =
        await this.tenantService.findByIdentifier(tenantIdentifier);

      if (tenant) {
        // Set tenant on request for later use
        request.tenant = tenant;

        // Set tenant context for database
        if (tenant.isolationMode === 'rls') {
          // For RLS, set the tenant_id in the session
          await this.tenantService.setTenantContext(tenant.id);
        } else if (tenant.isolationMode === 'schema') {
          // For schema-per-tenant, switch the schema
          await this.tenantService.setTenantSchema(tenant.schemaName);
        }
      }
    }

    return next.handle();
  }

  private extractTenantIdentifier(request: any): string | null {
    // Try to get from subdomain
    if (request.headers.host) {
      const host = request.headers.host;
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
        return subdomain;
      }
    }

    // Try to get from API key header
    if (request.headers['x-tenant-key']) {
      return request.headers['x-tenant-key'];
    }

    // Try to get from JWT token (for authenticated requests)
    if (request.user && request.user.tenantId) {
      return request.user.tenantId;
    }

    return null;
  }
}
