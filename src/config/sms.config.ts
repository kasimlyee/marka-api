import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  username: process.env.SMS_USERNAME,
  password: process.env.SMS_PASSWORD,
  defaultSenderId: process.env.SMS_DEFAULT_SENDER_ID,
  defaultPriority: parseInt(process.env.SMS_DEFAULT_PRIORITY ?? '2', 10),
  isSandbox: process.env.SMS_SANDBOX_MODE === 'true',
  timeout: parseInt(process.env.SMS_TIMEOUT ?? '10000', 10),
  maxRetries: parseInt(process.env.SMS_MAX_RETRIES ?? '3', 10),
  retryDelay: parseInt(process.env.SMS_RETRY_DELAY ?? '1000', 10),
}));
