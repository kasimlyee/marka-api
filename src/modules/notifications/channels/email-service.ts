import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createTransport, Transporter } from 'nodemailer';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private redis: Redis;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  async onModuleInit() {
    await this.initializeTransporter();
    await this.warmupTemplateCache();
  }

  private async initializeTransporter(): Promise<void> {
    const emailConfig = this.configService.get('email');

    this.transporter = createTransport(
      emailConfig.transport,
      emailConfig.defaults,
    );

    // Verify connection with retry logic
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        await this.transporter.verify();
        this.logger.log('SMTP connection established successfully');
        return;
      } catch (error) {
        attempts++;
        this.logger.warn(
          `SMTP connection attempt ${attempts} failed: ${error.message}`,
        );

        if (attempts === maxAttempts) {
          this.logger.error(
            'Failed to establish SMTP connection after multiple attempts',
          );
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000 * attempts)); // Exponential backoff
      }
    }
  }

  private async warmupTemplateCache(): Promise<void> {
    const templatesPath = this.configService.get('email.templates.path');

    try {
      const templateFiles = await fs.readdir(templatesPath);

      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          await this.compileTemplate(templateName);
        }
      }

      this.logger.log(`Preloaded ${templateFiles.length} email templates`);
    } catch (error) {
      this.logger.warn('Failed to preload email templates', error);
    }
  }

  async send(options: EmailOptions): Promise<void> {
    const {
      to,
      subject,
      template,
      context = {},
      priority = 'normal',
    } = options;

    try {
      const html = await this.compileTemplate(template, context);

      const mailOptions = {
        to,
        subject,
        html,
        priority: this.getPriorityHeader(priority),
        headers: {
          'X-Priority': this.getPriorityHeader(priority),
          'X-Mailer': 'Marka Notification System',
        },
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Cache successful delivery
      await this.redis.setex(
        `email:delivery:${info.messageId}`,
        86400,
        'delivered',
      ); // 24 hours

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);

      // Store failed delivery for retry
      await this.redis.rpush(
        'email:failed',
        JSON.stringify({
          to,
          subject,
          template,
          context,
          priority,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      );

      throw error;
    }
  }

  private getPriorityHeader(priority: string): string {
    const priorities = {
      high: '1',
      normal: '3',
      low: '5',
    };
    return priorities[priority] || '3';
  }

  private async compileTemplate(
    templateName: string,
    context: Record<string, any> = {},
  ): Promise<string> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)(context);
    }

    // Register partials
    await this.registerPartials();

    // Load and compile template
    try {
      const templatePath = path.join(
        this.configService.get('email.templates.path'),
        `${templateName}.hbs`,
      );

      const templateSource = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);

      // Register helpers
      this.registerHelpers();

      // Cache the compiled template
      this.templateCache.set(templateName, template);

      return template(context);
    } catch (error) {
      this.logger.error(
        `Failed to compile email template: ${templateName}`,
        error,
      );

      // Fallback to default template
      return this.getFallbackTemplate(context);
    }
  }

  private async registerPartials(): Promise<void> {
    const partialsPath = path.join(
      this.configService.get('email.templates.path'),
      'partials',
    );

    try {
      const partialFiles = await fs.readdir(partialsPath);

      for (const file of partialFiles) {
        if (file.endsWith('.hbs')) {
          const partialName = path.basename(file, '.hbs');
          const partialSource = await fs.readFile(
            path.join(partialsPath, file),
            'utf-8',
          );
          handlebars.registerPartial(partialName, partialSource);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to register email template partials', error);
    }
  }

  private registerHelpers(): void {
    handlebars.registerHelper('formatDate', (date: Date) => {
      return new Intl.DateTimeFormat('en-UG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    });

    handlebars.registerHelper('currency', (amount: number) => {
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
      }).format(amount);
    });

    handlebars.registerHelper('if_eq', function (a, b, opts) {
      return a === b ? opts.fn(this) : opts.inverse(this);
    });
  }

  private getFallbackTemplate(context: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${context.subject || 'Notification'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #fff; }
          .footer { padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Marka</h1>
          </div>
          <div class="content">
            ${context.content || 'Notification content'}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Marka. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async getDeliveryStatus(messageId: string): Promise<string> {
    return this.redis.get(`email:delivery:${messageId}`) || 'unknown';
  }

  async retryFailedEmails(): Promise<void> {
    const failedEmails = await this.redis.lrange('email:failed', 0, -1);

    for (const emailData of failedEmails) {
      try {
        const email = JSON.parse(emailData);
        await this.send(email);
        await this.redis.lrem('email:failed', 1, emailData);
      } catch (error) {
        this.logger.error('Failed to retry email', error);
      }
    }
  }
}
