import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions, EmailAnalytics } from './interfaces/email.interface';

@Injectable()
export class EmailAnalyticsService {
  private readonly logger = new Logger(EmailAnalyticsService.name);
  private analytics: Map<string, any> = new Map();

  async trackSent(
    messageId: string,
    emailOptions: EmailOptions,
  ): Promise<void> {
    const data = {
      messageId,
      to: emailOptions.to,
      subject: emailOptions.subject,
      template: emailOptions.template,
      sentAt: new Date(),
      status: 'sent',
    };

    this.analytics.set(messageId, data);
    this.logger.log(`Email sent tracked: ${messageId}`);
  }

  async trackDelivered(messageId: string): Promise<void> {
    const data = this.analytics.get(messageId);
    if (data) {
      data.deliveredAt = new Date();
      data.status = 'delivered';
      this.analytics.set(messageId, data);
    }
  }

  async trackOpened(
    messageId: string,
    userAgent?: string,
    ip?: string,
  ): Promise<void> {
    const data = this.analytics.get(messageId);
    if (data) {
      data.openedAt = new Date();
      data.opens = (data.opens || 0) + 1;
      data.userAgent = userAgent;
      data.ip = ip;
      this.analytics.set(messageId, data);
    }
  }

  async trackClicked(messageId: string, url: string): Promise<void> {
    const data = this.analytics.get(messageId);
    if (data) {
      data.clickedAt = new Date();
      data.clicks = (data.clicks || 0) + 1;
      data.clickedUrls = [...(data.clickedUrls || []), url];
      this.analytics.set(messageId, data);
    }
  }

  async trackBounced(
    messageId: string,
    bounceType: string,
    reason: string,
  ): Promise<void> {
    const data = this.analytics.get(messageId);
    if (data) {
      data.bouncedAt = new Date();
      data.bounceType = bounceType;
      data.bounceReason = reason;
      data.status = 'bounced';
      this.analytics.set(messageId, data);
    }
  }

  async trackFailed(emailOptions: EmailOptions, error: string): Promise<void> {
    const failureId = `failed_${Date.now()}`;
    const data = {
      failureId,
      to: emailOptions.to,
      subject: emailOptions.subject,
      error,
      failedAt: new Date(),
      status: 'failed',
    };

    this.analytics.set(failureId, data);
    this.logger.error(`Email failure tracked: ${failureId}`);
  }

  async getAnalytics(messageId: string): Promise<any> {
    return this.analytics.get(messageId);
  }

  async getDailyAnalytics(date: Date): Promise<EmailAnalytics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayData = Array.from(this.analytics.values()).filter(
      (data) => data.sentAt >= startOfDay && data.sentAt <= endOfDay,
    );

    return {
      sent: dayData.length,
      delivered: dayData.filter((d) => d.status === 'delivered').length,
      bounced: dayData.filter((d) => d.status === 'bounced').length,
      failed: dayData.filter((d) => d.status === 'failed').length,
      opened: dayData.filter((d) => d.opens > 0).length,
      clicked: dayData.filter((d) => d.clicks > 0).length,
      unsubscribed: dayData.filter((d) => d.unsubscribed).length,
      date,
    };
  }
}
