import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './common/services/email/email.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly emailService: EmailService) {}
  getHello(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Marka API</title>
        <style>
          body {
            font-family: monospace, monospace;
            background-color: #0d1117;
            color: #c9d1d9;
            padding: 20px;
          }
          .box {
            border: 2px solid #58a6ff;
            border-radius: 8px;
            padding: 20px;
            max-width: 700px;
            margin: auto;
          }
          h1 {
            color: #58a6ff;
            text-align: center;
          }
          .label {
            color: #8b949e;
            width: 120px;
            display: inline-block;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-weight: bold;
            color: #3fb950;
          }
          a {
            color: #58a6ff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>📘 Marka API - Report Cards</h1>
          <p><span class="label">Description</span>: SaaS Report Card Generator for Ugandan Schools (UNEB-compliant)</p>
          <p><span class="label">Version</span>: 1.0.0</p>
          <p><span class="label">Developer</span>: Kasim Lyee (<a href="mailto:lyee@codewithlyee.com">lyee@codewithlyee.com</a>)</p>
          <p><span class="label">Repository</span>: <a href="https://marka.codewithlyee.com">marka.codewithlyee.com</a></p>
          <p><span class="label">Docs</span>: <a href="/docs">/docs</a></p>
          <p><span class="label">Uptime</span>: ${process.uptime().toFixed(2)}s</p>
          <p><span class="label">Timestamp</span>: ${new Date().toISOString()}</p>
          <div class="footer">🚀 API is up and running</div>
        </div>
      </body>
      </html>
    `;
  }

  async testMail(): Promise<boolean> {
    const { messageId, success } = await this.emailService.sendEmail({
      to: 'user@example.com',
      subject: 'Welcome!',
      template: 'welcome',
      templateData: {
        name: 'John Doe',
        verificationUrl: 'https://marka.ug/verify/123',
      },
    });

    this.logger.log(`Email sent: ${messageId}, Success: ${success}`);
    return success;
  }
}
