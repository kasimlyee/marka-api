import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Marka',
    email: process.env.EMAIL_FROM_EMAIL || 'noreply@marka.ug',
  },
  replyTo: process.env.EMAIL_REPLY_TO,
  templates: {
    path: process.env.EMAIL_TEMPLATES_PATH || './src/templates',
  },
  queue: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
      password: process.env.REDIS_PASSWORD,
    },
  },
  tracking: {
    enabled: process.env.EMAIL_TRACKING_ENABLED === 'true',
    domain: process.env.EMAIL_TRACKING_DOMAIN || 'yourapp.com',
  },
}));
