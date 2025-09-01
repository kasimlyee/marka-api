import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from './email.service';
import { EmailOptions } from './interfaces/email.interface';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<{ emailOptions: EmailOptions }>) {
    const { emailOptions } = job.data;

    this.logger.log(`Processing email job ${job.id} to ${emailOptions.to}`);

    try {
      const result = await this.emailService.sendEmail(emailOptions);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.id}`, error);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed`, err);
  }
}
