export enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
  TWO_FACTOR = 'two_factor',
  PASSWORD_RESET = 'password_reset',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export enum VerificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  APP = 'app',
}
