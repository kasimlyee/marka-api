import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

@Injectable()
export class RateLimitService {
  //private readonly logger = new Logger(RateLimitService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async checkRateLimit(key: string, options: RateLimitOptions): Promise<void> {
    const { maxAttempts, windowMs } = options;

    const current = await this.redis.get(key);
    const attempts = current ? parseInt(current, 10) : 0;

    if (attempts >= maxAttempts) {
      throw new Error('Rate limit exceeded');
    }

    await this.redis.multi().incr(key).pexpire(key, windowMs).exec();
  }

  async getRemainingAttempts(
    key: string,
    maxAttempts: number,
  ): Promise<number> {
    const current = await this.redis.get(key);
    const attempts = current ? parseInt(current, 10) : 0;
    return Math.max(0, maxAttempts - attempts);
  }

  async resetRateLimit(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
