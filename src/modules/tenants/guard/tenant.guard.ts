import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TenantService } from '../tenants.service';
import { Tenant } from '../tenant.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantService: TenantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // console.log('=== TENANT GUARD START ===');
    // console.log('Request user:', request.user);

    if (this.shouldSkipTenantProcessing(request)) {
      // console.log('Skipping tenant processing');
      return true;
    }

    // Extract tenant identifier from JWT (secure source)
    const tenantIdentifier = this.extractTenantIdentifierFromJWT(request);
    // console.log('Tenant identifier from JWT:', tenantIdentifier);

    if (!tenantIdentifier) {
      // console.warn('No tenant identifier found in JWT');
      return true; // Allow request to continue without tenant context
    }

    try {
      // Resolve tenant from secure JWT source
      const tenant: Tenant =
        await this.tenantService.findById(tenantIdentifier);
      // console.log('Found tenant:', tenant);

      if (tenant) {
        // Set tenant on request for later use
        request.tenant = tenant;

        // Set tenant context for database
        if (tenant.isolationMode === 'rls') {
          await this.tenantService.setTenantContext(tenant.id);
        } else if (tenant.isolationMode === 'schema') {
          await this.tenantService.setTenantSchema(tenant.schemaName);
        }
      }
    } catch (error) {
      // console.warn(`Tenant not found for identifier: ${tenantIdentifier}`);
      //  console.warn('Request can continue without tenant context');
    }

    return true;
  }

  private extractTenantIdentifierFromJWT(request: any): string | null {
    // UUID validation regex
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Get from JWT token (secure source)
    if (request.user && request.user.tenantId) {
      const tenantId = request.user.tenantId;
      if (uuidRegex.test(tenantId)) {
        return tenantId;
      }
    }

    return null;
  }

  private shouldSkipTenantProcessing(request: any): boolean {
    const url = request.url;
    const method = request.method;

    // Skip tenant processing for these routes
    const skipRoutes = [
      { method: 'POST', path: '/auth/register' },
      { method: 'POST', path: '/auth/login' },
      { method: 'POST', path: '/auth/forgot-password' },
      { method: 'POST', path: '/auth/reset-password' },
    ];

    return skipRoutes.some(
      (route) => method === route.method && url.includes(route.path),
    );
  }
}
