import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EmailTemplateService } from './email-template.service';
import { EmailQueueService } from './email-queue.service';
import { EmailAnalyticsService } from './email-analytics.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailTemplateService,
    EmailQueueService,
    EmailProcessor,
    EmailAnalyticsService,
  ],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}