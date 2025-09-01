import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EmailOptions, EmailJob } from './interfaces/email.interface';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async addToQueue(
    emailOptions: EmailOptions,
    options: {
      priority?: number;
      delay?: number;
      attempts?: number;
      backoff?: any;
      jobId?: string;
    } = {},
  ): Promise<string> {
    try {
      const job = await this.emailQueue.add(
        'send-email',
        { emailOptions },
        {
          priority: options.priority || 0,
          delay: options.delay || 0,
          attempts: options.attempts || 3,
          backoff: options.backoff || { type: 'exponential', delay: 5000 },
          jobId: options.jobId,
        },
      );

      this.logger.log(`Email job added to queue: ${job.id}`);
      return job.id.toString();
    } catch (error) {
      this.logger.error('Failed to add email to queue', error);
      throw error;
    }
  }

  async addBulkToQueue(
    emails: EmailOptions[],
    options: {
      priority?: number;
      delay?: number;
      attempts?: number;
    } = {},
  ): Promise<string[]> {
    try {
      const jobs = emails.map((emailOptions, index) => ({
        name: 'send-email',
        data: { emailOptions },
        opts: {
          priority: options.priority || 0,
          delay: (options.delay || 0) + index * 1000, // Stagger emails
          attempts: options.attempts || 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      }));

      const createdJobs = await this.emailQueue.addBulk(jobs);
      const jobIds = createdJobs.map((job) => job.id.toString());

      this.logger.log(`${jobIds.length} email jobs added to queue`);
      return jobIds;
    } catch (error) {
      this.logger.error('Failed to add bulk emails to queue', error);
      throw error;
    }
  }

  async scheduleEmail(
    emailOptions: EmailOptions,
    scheduleDate: Date,
  ): Promise<string> {
    const delay = scheduleDate.getTime() - Date.now();

    if (delay < 0) {
      throw new Error('Schedule date must be in the future');
    }

    return this.addToQueue(emailOptions, { delay });
  }

  async getJob(jobId: string) {
    return this.emailQueue.getJob(jobId);
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} removed from queue`);
    }
  }

  async pauseQueue(): Promise<void> {
    await this.emailQueue.pause();
    this.logger.log('Email queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.emailQueue.resume();
    this.logger.log('Email queue resumed');
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaiting(),
      this.emailQueue.getActive(),
      this.emailQueue.getCompleted(),
      this.emailQueue.getFailed(),
      this.emailQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async cleanQueue(): Promise<void> {
    await this.emailQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await this.emailQueue.clean(24 * 60 * 60 * 1000, 'failed');
    this.logger.log('Email queue cleaned');
  }
}
