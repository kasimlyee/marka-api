import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { EmailOptions, EmailConfig } from './interfaces/email.interface';
import { EmailTemplateService } from './email-template.service';
import { EmailAnalyticsService } from './email-analytics.service';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private emailConfig: EmailConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: EmailTemplateService,
    private readonly analyticsService: EmailAnalyticsService,
  ) {
    this.emailConfig = this.configService.get<EmailConfig>('email.smtp')!;
  }

  async onModuleInit() {
    await this.createTransporter();
    await this.verifyConnection();
  }

  private async createTransporter(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransport({
        ...this.emailConfig,
        // logger: process.env.NODE_ENV === 'development',
        //  debug: process.env.NODE_ENV === 'development',
      });

      this.logger.log('Email transporter created successfully');
    } catch (error) {
      this.logger.error('Failed to create email transporter', error);
      throw error;
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('SMTP connection verification failed', error);
      throw error;
    }
  }

  async sendEmail(
    emailOptions: EmailOptions,
  ): Promise<{ messageId: string; success: boolean }> {
    try {
      const mailOptions = await this.buildMailOptions(emailOptions);
      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${result.messageId}`);

      // Track analytics
      await this.analyticsService.trackSent(result.messageId, emailOptions);

      return {
        messageId: result.messageId,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to send email', error);

      // Track failed attempt
      await this.analyticsService.trackFailed(emailOptions, error.message);

      throw error;
    }
  }

  private async buildMailOptions(
    emailOptions: EmailOptions,
  ): Promise<Mail.Options> {
    const { template, templateData, ...otherOptions } = emailOptions;

    let html = emailOptions.html;
    let text = emailOptions.text;
    let subject = emailOptions.subject;

    // Process template if provided
    if (template) {
      const processedTemplate = await this.templateService.processTemplate(
        template,
        templateData || {},
      );
      html = processedTemplate.html;
      text = processedTemplate.text;
      subject = processedTemplate.subject;
    }

    // Add tracking pixels if enabled
    if (this.configService.get('email.tracking.enabled') && html) {
      html = this.addTrackingPixel(html, emailOptions);
    }

    const mailOptions: Mail.Options = {
      ...otherOptions,
      to: Array.isArray(emailOptions.to)
        ? emailOptions.to.join(',')
        : emailOptions.to,
      subject,
      html,
      text,
      replyTo: emailOptions.replyTo || this.emailConfig.replyTo,
    };

    // Add custom headers
    if (emailOptions.headers) {
      mailOptions.headers = emailOptions.headers;
    }

    // Set priority
    if (emailOptions.priority) {
      mailOptions.priority = emailOptions.priority;
    }

    return mailOptions;
  }

  private addTrackingPixel(html: string, emailOptions: EmailOptions): string {
    const trackingDomain = this.configService.get('email.tracking.domain');
    const trackingId = this.generateTrackingId();

    const trackingPixel = `<img src="https://${trackingDomain}/email/track/open/${trackingId}" width="1" height="1" style="display:none;">`;

    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`);
    }

    return `${html}${trackingPixel}`;
  }

  private generateTrackingId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendBulkEmails(
    emails: EmailOptions[],
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      emails.map((email) => this.sendEmail(email)),
    );

    const success = results.filter(
      (result) => result.status === 'fulfilled',
    ).length;
    const failed = results.filter(
      (result) => result.status === 'rejected',
    ).length;

    this.logger.log(
      `Bulk email results: ${success} successful, ${failed} failed`,
    );

    return { success, failed };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Connection test failed', error);
      return false;
    }
  }

  getTransporterInfo(): any {
    return {
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
      pool: this.emailConfig.pool,
    };
  }
}
