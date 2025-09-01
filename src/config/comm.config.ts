export default () => ({
  // Verification settings
  verification: {
    codeExpiry:
      parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES ?? '15') || 15,
    maxAttempts: parseInt(process.env.VERIFICATION_MAX_ATTEMPTS ?? '3') || 3,
    resendCooldown:
      parseInt(process.env.VERIFICATION_RESEND_COOLDOWN ?? '60') || 60, // seconds
  },

  // Email configuration
  email: {
    transport: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587') || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    },
    defaults: {
      from: process.env.EMAIL_FROM || '"Marka" <noreply@marka.ug>',
    },
    templates: {
      path: process.env.EMAIL_TEMPLATES_PATH || 'dist/templates/email',
    },
  },

  // SMS configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_PHONE_NUMBER,
    },
    africastalking: {
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME,
      from: process.env.AT_SENDER_ID,
    },
  },

  // WebSocket configuration
  websocket: {
    cors: {
      origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173'],
      credentials: true,
    },
  },

  // Security settings
  security: {
    verificationJwtSecret: process.env.VERIFICATION_JWT_SECRET,
    verificationJwtExpiresIn: process.env.VERIFICATION_JWT_EXPIRES_IN || '1h',
  },
});
