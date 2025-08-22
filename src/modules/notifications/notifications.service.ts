import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NotificationType,
  NotificationStatus,
  NotificationCategory,
} from './notification.entity';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as nodemailer from 'nodemailer';
import * as twilio from 'twilio';

@Injectable()
export class NotificationsService {
  private readonly emailTransporter: nodemailer.Transporter;
  private readonly twilioClient: twilio.Twilio;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Initialize Twilio client
    /** if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
    }
  */
  }

  async create(
    createNotificationDto: CreateNotificationDto,
    tenantId: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      tenantId,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Add to queue for sending
    await this.notificationsQueue.add('send', {
      notificationId: savedNotification.id,
    });

    return savedNotification;
  }

  async findAll(tenantId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, tenantId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    tenantId: string,
  ): Promise<Notification> {
    const notification = await this.findOne(id, tenantId);
    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const notification = await this.findOne(id, tenantId);
    await this.notificationRepository.remove(notification);
  }

  async sendNotification(id: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    try {
      // Update status to processing
      await this.update(
        id,
        { status: NotificationStatus.SENT },
        notification.tenantId,
      );

      // Send based on type
      switch (notification.type) {
        case NotificationType.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationType.SMS:
          await this.sendSMS(notification);
          break;
        case NotificationType.PUSH:
          await this.sendPushNotification(notification);
          break;
        default:
          throw new Error(
            `Unsupported notification type: ${notification.type}`,
          );
      }

      // Update status to delivered
      await this.update(
        id,
        {
          status: NotificationStatus.DELIVERED,
        },
        notification.tenantId,
      );
    } catch (error) {
      // Update status to failed
      await this.update(
        id,
        {
          status: NotificationStatus.FAILED,
          //providerResponse: error.message,
        },
        notification.tenantId,
      );
      throw error;
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@marka.ug',
      to: notification.recipient,
      subject: notification.title,
      html: notification.content,
    });
  }

  private async sendSMS(notification: Notification): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio client not configured');
    }

    await this.twilioClient.messages.create({
      body: notification.content,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: notification.recipient,
    });
  }

  private async sendPushNotification(
    notification: Notification,
  ): Promise<void> {
    // This would integrate with a push notification service like Firebase Cloud Messaging
    // For now, just log the notification
    console.log(
      `Push notification: ${notification.title} - ${notification.content}`,
    );
  }

  async sendReportReadyNotification(
    tenantId: string,
    recipient: string,
    reportData: {
      studentName: string;
      reportNo: string;
      downloadUrl: string;
    },
  ): Promise<Notification> {
    const title = 'Report Ready for Download';
    const content = `
      <p>Dear Parent/Guardian,</p>
      <p>The report card for <strong>${reportData.studentName}</strong> is ready for download.</p>
      <p>Report Number: <strong>${reportData.reportNo}</strong></p>
      <p>You can download it using the link below:</p>
      <p><a href="${reportData.downloadUrl}">Download Report</a></p>
      <p>Thank you,<br>Marka Team</p>
    `;

    return this.create(
      {
        title,
        content,
        type: NotificationType.EMAIL,
        category: NotificationCategory.REPORT_READY,
        recipient,
        metadata: {
          reportNo: reportData.reportNo,
          downloadUrl: reportData.downloadUrl,
        },
      },
      tenantId,
    );
  }

  async sendPaymentReceivedNotification(
    tenantId: string,
    recipient: string,
    paymentData: {
      amount: number;
      reference: string;
      plan: string;
    },
  ): Promise<Notification> {
    const title = 'Payment Received';
    const content = `
      <p>Dear Admin,</p>
      <p>We have received a payment of <strong>UGX ${paymentData.amount.toLocaleString()}</strong> for your subscription.</p>
      <p>Payment Reference: <strong>${paymentData.reference}</strong></p>
      <p>Plan: <strong>${paymentData.plan}</strong></p>
      <p>Thank you for your continued patronage.</p>
      <p>Best regards,<br>Marka Team</p>
    `;

    return this.create(
      {
        title,
        content,
        type: NotificationType.EMAIL,
        category: NotificationCategory.PAYMENT_RECEIVED,
        recipient,
        metadata: {
          amount: paymentData.amount,
          reference: paymentData.reference,
          plan: paymentData.plan,
        },
      },
      tenantId,
    );
  }

  async sendSubscriptionRenewalNotification(
    tenantId: string,
    recipient: string,
    subscriptionData: {
      plan: string;
      expiryDate: Date;
      renewalUrl: string;
    },
  ): Promise<Notification> {
    const title = 'Subscription Renewal Reminder';
    const content = `
      <p>Dear Admin,</p>
      <p>Your <strong>${subscriptionData.plan}</strong> subscription is due for renewal on <strong>${subscriptionData.expiryDate.toDateString()}</strong>.</p>
      <p>To avoid service interruption, please renew your subscription using the link below:</p>
      <p><a href="${subscriptionData.renewalUrl}">Renew Subscription</a></p>
      <p>Thank you,<br>Marka Team</p>
    `;

    return this.create(
      {
        title,
        content,
        type: NotificationType.EMAIL,
        category: NotificationCategory.SUBSCRIPTION_RENEWAL,
        recipient,
        metadata: {
          plan: subscriptionData.plan,
          expiryDate: subscriptionData.expiryDate,
          renewalUrl: subscriptionData.renewalUrl,
        },
      },
      tenantId,
    );
  }

  async markAsRead(id: string, tenantId: string): Promise<Notification> {
    return this.update(
      id,
      {
        status: NotificationStatus.READ,
        //readAt: new Date(),
      },
      tenantId,
    );
  }
}
