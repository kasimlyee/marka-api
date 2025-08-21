import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly rateLimits = new Map<string, { count: number; resetTime: number }>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get client identifier (IP or tenant ID)
    const clientId = request.tenant?.id || request.ip;

    // Get current time
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute window
    const maxRequests = 100; // Max requests per window

    // Get or initialize rate limit data for this client
    let rateLimit = this.rateLimits.get(clientId);

    if (!rateLimit || now > rateLimit.resetTime) {
      // Reset window
      rateLimit = {
        count: 0,
        resetTime: now + windowSize,
      };
      this.rateLimits.set(clientId, rateLimit);
    }

    // Check if limit exceeded
    if (rateLimit.count >= maxRequests) {
      response.setHeader('X-RateLimit-Limit', maxRequests);
      response.setHeader('X-RateLimit-Remaining', 0);
      response.setHeader('X-RateLimit-Reset', rateLimit.resetTime);

      throw new Error('Rate limit exceeded');
    }

    // Increment counter
    rateLimit.count++;

    // Set headers
    response.setHeader('X-RateLimit-Limit', maxRequests);
    response.setHeader('X-RateLimit-Remaining', maxRequests - rateLimit.count);
    response.setHeader('X-RateLimit-Reset', rateLimit.resetTime);

    return next.handle().pipe(
      tap(() => {
        // Success, do nothing
      }),
    );
  }
}