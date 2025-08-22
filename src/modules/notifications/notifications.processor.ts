import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { NotificationsService } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send')
  async sendNotification(job: Job<{ notificationId: string }>) {
    const { notificationId } = job.data;
    try {
      await this.notificationsService.sendNotification(notificationId);
    } catch (error) {
      console.error(`Error sending notification ${notificationId}:`, error);
      throw error;
    }
  }
}
