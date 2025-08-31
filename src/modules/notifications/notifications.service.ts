import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationChannel } from './enums/notification-channel.enum';
import { NotificationStatus } from './enums/notification-status.enum';
import { EmailService } from './channels/email.service';
import { SmsService } from './channels/sms.service';
import { WebSocketService } from './channels/websocket.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPriority } from './enums/notification-priority.enum';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly websocketService: WebSocketService,
    private readonly configService: ConfigService,
  ) {
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async onModuleInit() {
    // Retry failed notifications on startup
    await this.retryFailedNotifications();
  }

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create(createNotificationDto);
    const savedNotification = await this.notificationRepo.save(notification);

    // Send notification asynchronously
    this.sendNotificationWithRetry(savedNotification).catch((error) => {
      this.logger.error(
        `Failed to send notification after retries: ${error.message}`,
      );
    });

    return savedNotification;
  }

  private async sendNotificationWithRetry(
    notification: Notification,
    attempt: number = 1,
  ): Promise<void> {
    try {
      await this.sendNotification(notification);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        this.logger.warn(
          `Retry attempt ${attempt} for notification ${notification.id}`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * attempt),
        );
        await this.sendNotificationWithRetry(notification, attempt + 1);
      } else {
        await this.notificationRepo.update(notification.id, {
          status: NotificationStatus.FAILED,
          errorMessage: error.message,
        });
        throw error;
      }
    }
  }

  async sendNotification(notification: Notification): Promise<void> {
    try {
      const sendPromises = notification.channels.map((channel: any) =>
        this.sendToChannel(notification, channel),
      );

      await Promise.allSettled(sendPromises);

      // Update notification status
      await this.notificationRepo.update(notification.id, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      this.logger.log(`Notification ${notification.id} sent successfully`);
    } catch (error) {
      this.logger.error(
        `Notification sending failed: ${error.message}`,
        error.stack,
      );

      await this.notificationRepo.update(notification.id, {
        status: NotificationStatus.FAILED,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  private async sendToChannel(
    notification: Notification,
    channel: NotificationChannel,
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.emailService.send({
          to: notification.recipient,
          subject: notification.title,
          template: notification.template,
          context: notification.context,
          priority: notification.priority,
        });
        break;

      case NotificationChannel.SMS:
        await this.smsService.send({
          to: notification.recipient,
          template: notification.template,
          context: notification.context,
        });
        break;

      case NotificationChannel.IN_APP:
        await this.websocketService.sendToUser(notification.recipient, {
          type: 'notification',
          data: {
            id: notification.id,
            title: notification.title,
            content: notification.content,
            category: notification.category,
            priority: notification.priority,
            createdAt: notification.createdAt,
          },
        });
        break;

      case NotificationChannel.PUSH:
        // Implement push notification service
        this.logger.warn('Push notifications not implemented yet');
        break;
    }
  }

  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = await this.notificationRepo.find({
      where: {
        status: NotificationStatus.FAILED,
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)), // Last 24 hours
      },
    });

    for (const notification of failedNotifications) {
      this.sendNotificationWithRetry(notification).catch((error) => {
        this.logger.error(
          `Failed to retry notification ${notification.id}: ${error.message}`,
        );
      });
    }
  }

  async findUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      category?: string;
      read?: boolean;
    } = {},
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { limit = 50, offset = 0, category, read } = options;

    const query = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.recipient = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (category) {
      query.andWhere('notification.category = :category', { category });
    }

    if (read !== undefined) {
      query.andWhere('notification.isRead = :read', { read });
    }

    const [notifications, total] = await query.getManyAndCount();
    return { notifications, total };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepo.update(
      { id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { recipient: userId, isRead: false },
    });
  }
}
