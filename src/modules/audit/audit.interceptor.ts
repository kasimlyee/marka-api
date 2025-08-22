import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { ActionType } from './audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get tenant and user from request
    const tenant = request.tenant;
    const user = request.user;

    // Get handler metadata
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    // Determine action type based on HTTP method
    let action: ActionType;
    switch (request.method) {
      case 'GET':
        action = ActionType.READ;
        break;
      case 'POST':
        action = ActionType.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        action = ActionType.UPDATE;
        break;
      case 'DELETE':
        action = ActionType.DELETE;
        break;
      default:
        action = ActionType.READ;
    }

    // Get entity name from controller or handler
    const entity = className.replace('Controller', '');

    // Get IP address and user agent
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap((data) => {
        // Log successful action
        if (tenant && user) {
          if (action === ActionType.CREATE && data && data.id) {
            // Log create action with new values
            this.auditService.logCreate(
              entity,
              data.id,
              tenant.id,
              user.id,
              data,
              userAgent,
              ipAddress,
            );
          } else if (action === ActionType.READ) {
            // Log read action
            const entityId = request.params.id;
            if (entityId) {
              this.auditService.logRead(
                entity,
                entityId,
                tenant.id,
                user.id,
                userAgent,
                ipAddress,
              );
            }
          } else if (action === ActionType.UPDATE) {
            // Log update action
            const entityId = request.params.id;
            if (entityId) {
              // In a real implementation, you would fetch the old values here
              this.auditService.logUpdate(
                entity,
                entityId,
                tenant.id,
                user.id,
                {}, // Old values would be fetched from DB
                request.body, // New values from request body
                undefined,
                userAgent,
              );
            }
          } else if (action === ActionType.DELETE) {
            // Log delete action
            const entityId = request.params.id;
            if (entityId) {
              // In a real implementation, you would fetch the old values here
              this.auditService.logDelete(
                entity,
                entityId,
                tenant.id,
                user.id,
                {}, // Old values would be fetched from DB
                userAgent,
                ipAddress,
              );
            }
          }
        }
      }),
    );
  }
}
