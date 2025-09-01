import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailQueueService } from './email-queue.service';
import { EmailOptions } from './interfaces/email.interface';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

@Injectable()
export class EmailRetryService {
  private readonly logger = new Logger(EmailRetryService.name);
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 5000,
    maxDelay: 300000, // 5 minutes
    backoffMultiplier: 2,
  };

  constructor(
    private readonly emailService: EmailService,
    private readonly queueService: EmailQueueService,
  ) {}

  async sendWithRetry(
    emailOptions: EmailOptions,
    retryConfig: Partial<RetryConfig> = {},
  ): Promise<{ messageId: string; success: boolean; attempts: number }> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await this.emailService.sendEmail(emailOptions);

        if (attempt > 1) {
          this.logger.log(`Email sent successfully after ${attempt} attempts`);
        }

        return { ...result, attempts: attempt };
      } catch (error) {
        this.logger.warn(
          `Email send attempt ${attempt} failed: ${error.message}`,
        );

        if (attempt < config.maxRetries) {
          const delay = this.calculateDelay(attempt, config);
          this.logger.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `Failed to send email after ${config.maxRetries} attempts`,
    );
    throw Error;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay =
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async requeueFailedEmails(): Promise<number> {
    // This would typically query a database for failed email records
    // For now, we'll simulate with queue inspection
    const stats = await this.queueService.getQueueStats();

    if (stats.failed > 0) {
      this.logger.log(`Found ${stats.failed} failed emails to requeue`);
      // Implementation would depend on failed email storage strategy
    }

    return stats.failed;
  }
}
