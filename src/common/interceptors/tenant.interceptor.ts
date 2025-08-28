import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from '../../modules/tenants/tenants.service';
import { Tenant } from '../../modules/tenants/tenant.entity';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  // Make constructor private to enforce factory usage
  private constructor(private readonly tenantService: TenantService) {}

  // Factory method
  static create(tenantService: TenantService): TenantInterceptor {
    return new TenantInterceptor(tenantService);
  }

  // tenant.interceptor.ts
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract tenant identifier from request
    const tenantIdentifier = this.extractTenantIdentifier(request);

    if (tenantIdentifier) {
      try {
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
      } catch (error) {
        // Log the error but don't break the request
        console.warn(`Tenant not found for identifier: ${tenantIdentifier}`);
        console.warn('Request can continue without tenant context');
      }
    }

    return next.handle();
  }

  private extractTenantIdentifier(request: any): string | null {
    // UUID validation regex
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Try to get from subdomain
    if (request.headers.host) {
      const host = request.headers.host;
      const subdomain = host.split('.')[0];

      // Check if subdomain is a valid UUID
      if (subdomain && uuidRegex.test(subdomain)) {
        return subdomain;
      }

      // If subdomain has extra data, try to extract UUID part
      if (subdomain && subdomain.length > 36) {
        const possibleUuid = subdomain.substring(0, 36);
        if (uuidRegex.test(possibleUuid)) {
          return possibleUuid;
        }
      }
    }

    // Try to get from API key header
    if (request.headers['x-tenant-key']) {
      const apiKey = request.headers['x-tenant-key'];
      if (uuidRegex.test(apiKey)) {
        return apiKey;
      }
    }

    // Try to get from JWT token (for authenticated requests)
    if (request.user && request.user.tenantId) {
      const tenantId = request.user.tenantId;
      if (uuidRegex.test(tenantId)) {
        return tenantId;
      }
    }

    return null;
  }
}
