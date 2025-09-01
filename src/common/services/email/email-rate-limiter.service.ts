import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RateLimit {
  maxEmails: number;
  timeWindow: number; // in milliseconds
  resetTime: number;
}

@Injectable()
export class EmailRateLimiterService {
  private readonly logger = new Logger(EmailRateLimiterService.name);
  private rateLimits: Map<string, { count: number; resetTime: number }> =
    new Map();
  private globalRateLimit: RateLimit;

  constructor(private readonly configService: ConfigService) {
    this.globalRateLimit = {
      maxEmails: this.configService.get('email.rateLimit.maxEmails', 100),
      timeWindow: this.configService.get('email.rateLimit.timeWindow', 3600000), // 1 hour
      resetTime:
        Date.now() +
        this.configService.get('email.rateLimit.timeWindow', 3600000),
    };
  }

  async checkRateLimit(
    identifier: string,
    customLimit?: RateLimit,
  ): Promise<boolean> {
    const limit = customLimit || this.globalRateLimit;
    const now = Date.now();

    const current = this.rateLimits.get(identifier);

    if (!current) {
      this.rateLimits.set(identifier, {
        count: 1,
        resetTime: now + limit.timeWindow,
      });
      return true;
    }

    if (now > current.resetTime) {
      // Reset the counter
      this.rateLimits.set(identifier, {
        count: 1,
        resetTime: now + limit.timeWindow,
      });
      return true;
    }

    if (current.count >= limit.maxEmails) {
      this.logger.warn(`Rate limit exceeded for ${identifier}`);
      return false;
    }

    current.count++;
    this.rateLimits.set(identifier, current);
    return true;
  }

  async getRateLimitStatus(identifier: string): Promise<{
    count: number;
    limit: number;
    resetTime: number;
    remaining: number;
  }> {
    const current = this.rateLimits.get(identifier);

    if (!current) {
      return {
        count: 0,
        limit: this.globalRateLimit.maxEmails,
        resetTime: Date.now() + this.globalRateLimit.timeWindow,
        remaining: this.globalRateLimit.maxEmails,
      };
    }

    return {
      count: current.count,
      limit: this.globalRateLimit.maxEmails,
      resetTime: current.resetTime,
      remaining: Math.max(0, this.globalRateLimit.maxEmails - current.count),
    };
  }

  cleanupExpiredLimits(): void {
    const now = Date.now();

    for (const [identifier, data] of this.rateLimits.entries()) {
      if (now > data.resetTime) {
        this.rateLimits.delete(identifier);
      }
    }

    this.logger.log(`Cleaned up ${this.rateLimits.size} rate limit entries`);
  }
}
