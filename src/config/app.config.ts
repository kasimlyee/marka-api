import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  jwtExpirationTime: process.env.JWT_EXPIRATION_TIME || '15m',
  jwtRefreshExpirationTime: process.env.JWT_REFRESH_EXPIRATION_TIME || '7d',
}));