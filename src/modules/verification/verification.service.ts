import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { VerificationCode } from './entities/verification-code.entity';
import { VerificationType } from './enums/verification-type.enum';
import { VerificationChannel } from './enums/verification-channel.enum';
import { NotificationService } from '../notification/notification.service';
import { RateLimitService } from '../../common/services/rate-limit.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly codeExpiryMinutes: number;
  private readonly maxAttempts: number;

  constructor(
    @InjectRepository(VerificationCode)
    private readonly verificationRepo: Repository<VerificationCode>,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
  ) {
    this.codeExpiryMinutes =
      this.configService.get<number>('verification.codeExpiry') ?? 15;
    this.maxAttempts =
      this.configService.get<number>('verification.maxAttempts') ?? 3;
  }

  async generateVerificationCode(
    identifier: string,
    type: VerificationType,
    channel: VerificationChannel,
    metadata?: Record<string, any>,
  ): Promise<string> {
    // Check rate limiting
    const rateLimitKey = `verification:${identifier}:${type}`;
    await this.rateLimitService.checkRateLimit(rateLimitKey, {
      maxAttempts: this.maxAttempts,
      windowMs:
        (this.configService.get<number>('verification.resendCooldown') ?? 60) *
        1000,
    });

    // Generate cryptographically secure code
    const code = this.generateSecureCode();
    const expiresAt = new Date(Date.now() + this.codeExpiryMinutes * 60 * 1000);

    // Invalidate any existing codes with transaction
    await this.verificationRepo.manager.transaction(async (entityManager) => {
      await entityManager.update(
        VerificationCode,
        {
          identifier,
          type,
          channel,
          isUsed: false,
          expiresAt: MoreThan(new Date()),
        },
        { isUsed: true, invalidatedAt: new Date() },
      );

      // Save new code
      const verificationCode = entityManager.create(VerificationCode, {
        identifier,
        code,
        type,
        channel,
        expiresAt,
        metadata,
        attempts: 0,
      });

      await entityManager.save(verificationCode);
    });

    // Send code via appropriate channel
    await this.sendVerificationCode(identifier, code, channel, type, metadata);

    return code;
  }

  private generateSecureCode(): string {
    // Cryptographically secure random code generation
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    return (100000 + (randomBytes[0] % 900000)).toString();
  }

  private async sendVerificationCode(
    identifier: string,
    code: string,
    channel: VerificationChannel,
    type: VerificationType,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const context = {
      code,
      expiryMinutes: this.codeExpiryMinutes,
      identifier,
      ...metadata,
    };

    try {
      if (channel === VerificationChannel.EMAIL) {
        await this.notificationService.sendEmail({
          to: identifier,
          subject: this.getVerificationSubject(type),
          template: `verification-${type.toLowerCase()}`,
          context,
        });
      } else if (channel === VerificationChannel.SMS) {
        await this.notificationService.sendSms({
          to: identifier,
          template: `verification-${type.toLowerCase()}`,
          context,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send verification code to ${identifier}`,
        error.stack,
      );
      throw new Error('Failed to send verification code');
    }
  }

  private getVerificationSubject(type: VerificationType): string {
    const subjects = {
      [VerificationType.EMAIL_VERIFICATION]: 'Verify Your Email Address',
      [VerificationType.PHONE_VERIFICATION]: 'Verify Your Phone Number',
      [VerificationType.PASSWORD_RESET]: 'Reset Your Password',
      [VerificationType.TWO_FACTOR]: 'Your Two-Factor Authentication Code',
    };
    return subjects[type];
  }

  async verifyCode(
    identifier: string,
    code: string,
    type: VerificationType,
    incrementAttempts: boolean = true,
  ): Promise<{ isValid: boolean; remainingAttempts?: number }> {
    const verificationCode = await this.verificationRepo.findOne({
      where: {
        identifier,
        code,
        type,
        isUsed: false,
        invalidatedAt: null,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!verificationCode) {
      return { isValid: false };
    }

    // Check if maximum attempts exceeded
    if (verificationCode.attempts >= this.maxAttempts) {
      await this.verificationRepo.update(
        { id: verificationCode.id },
        { isExpired: true },
      );
      return { isValid: false };
    }

    if (incrementAttempts) {
      await this.verificationRepo.increment(
        { id: verificationCode.id },
        'attempts',
        1,
      );
    }

    const remainingAttempts =
      this.maxAttempts - (verificationCode.attempts + 1);
    return { isValid: true, remainingAttempts };
  }

  async generateVerificationToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('security.verificationJwtSecret'),
      expiresIn: this.configService.get('security.verificationJwtExpiresIn'),
    });
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('security.verificationJwtSecret'),
      });
    } catch (error) {
      this.logger.error('Token verification failed', error.stack);
      throw new ForbiddenException('Invalid or expired verification token');
    }
  }

  async cleanupExpiredCodes(): Promise<void> {
    await this.verificationRepo.delete({
      expiresAt: LessThanOrEqual(new Date()),
    });
  }
}
