import { Injectable, Logger } from '@nestjs/common';
import { EmailAnalyticsService } from './email-analytics.service';

export interface WebhookPayload {
  event: string;
  messageId: string;
  timestamp: string;
  email: string;
  [key: string]: any;
}

@Injectable()
export class EmailWebhooksService {
  private readonly logger = new Logger(EmailWebhooksService.name);

  constructor(private readonly analyticsService: EmailAnalyticsService) {}

  async handleWebhook(
    provider: string,
    payload: WebhookPayload,
  ): Promise<void> {
    this.logger.log(
      `Received ${provider} webhook: ${payload.event} for ${payload.messageId}`,
    );

    try {
      switch (payload.event) {
        case 'delivered':
          await this.analyticsService.trackDelivered(payload.messageId);
          break;

        case 'opened':
          await this.analyticsService.trackOpened(
            payload.messageId,
            payload.userAgent,
            payload.ip,
          );
          break;

        case 'clicked':
          await this.analyticsService.trackClicked(
            payload.messageId,
            payload.url,
          );
          break;

        case 'bounced':
          await this.analyticsService.trackBounced(
            payload.messageId,
            payload.bounceType,
            payload.reason,
          );
          break;

        default:
          this.logger.warn(`Unknown webhook event: ${payload.event}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${payload.event}`, error);
      throw error;
    }
  }

  // Provider-specific webhook handlers
  async handleSendGridWebhook(payload: any): Promise<void> {
    const events = Array.isArray(payload) ? payload : [payload];

    for (const event of events) {
      await this.handleWebhook('sendgrid', {
        event: event.event,
        messageId: event.sg_message_id,
        timestamp: event.timestamp,
        email: event.email,
        ...event,
      });
    }
  }

  async handleMailgunWebhook(payload: any): Promise<void> {
    await this.handleWebhook('mailgun', {
      event: payload.event,
      messageId: payload['message-id'],
      timestamp: payload.timestamp,
      email: payload.recipient,
      ...payload,
    });
  }

  async handleAmazonSESWebhook(payload: any): Promise<void> {
    const message = JSON.parse(payload.Message);

    await this.handleWebhook('ses', {
      event: message.eventType,
      messageId: message.mail.messageId,
      timestamp: message.mail.timestamp,
      email: message.mail.destination[0],
      ...message,
    });
  }
}
