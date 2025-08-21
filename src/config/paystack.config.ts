import { registerAs } from '@nestjs/config';

export default registerAs('paystack', () => ({
  secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
  currency: process.env.PAYSTACK_CURRENCY || 'UGX',
}));