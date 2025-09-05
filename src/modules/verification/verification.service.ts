import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Verification } from './verification.entity';
import {
  VerificationType,
  VerificationStatus,
  VerificationChannel,
} from './verification.enum';
import { SmsService } from '../../common/services/sms/sms.service';
import { EmailService } from '../../common/services/email/email.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  private readonly codeExpiration: number;
  private readonly maxAttempts: number;
  private readonly rateLimitWindow: number;

  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.codeExpiration = this.configService.get<number>(
      'VERIFICATION_CODE_EXPIRATION',
      900,
    ); // 15 minutes
    this.maxAttempts = this.configService.get<number>(
      'VERIFICATION_MAX_ATTEMPTS',
      5,
    );
    this.rateLimitWindow = this.configService.get<number>(
      'VERIFICATION_RATE_LIMIT_WINDOW',
      3600,
    ); // 1 hour
  }

  private generateCode(length: number = 6): string {
    return crypto
      .randomInt(0, 10 ** length)
      .toString()
      .padStart(length, '0');
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async checkRateLimit(
    target: string,
    type: VerificationType,
  ): Promise<void> {
    const key = `verification:rate_limit:${type}:${target}`;
    const attempts = (await this.cacheManager.get<number>(key)) || 0;

    if (attempts >= this.maxAttempts) {
      throw new ForbiddenException(
        'Too many verification attempts. Please try again later.',
      );
    }

    await this.cacheManager.set(key, attempts + 1, this.rateLimitWindow * 1000);
  }

  async initiateVerification(
    userId: string,
    type: VerificationType,
    target: string,
    channel: VerificationChannel,
    metadata?: Record<string, any>,
  ): Promise<{ code: string; token: string; expiresAt: Date }> {
    await this.checkRateLimit(target, type);

    // Invalidate any existing pending verifications
    await this.verificationRepository.update(
      { userId, type, status: VerificationStatus.PENDING },
      { status: VerificationStatus.EXPIRED },
    );

    const code = this.generateCode();
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + this.codeExpiration * 1000);

    const verification = this.verificationRepository.create({
      type,
      code,
      token,
      target,
      userId,
      expiresAt,
      metadata,
    });

    await this.verificationRepository.save(verification);

    // Send code via appropriate channel
    switch (channel) {
      case VerificationChannel.SMS:
        await this.sendSmsCode(target, code);
        break;
      case VerificationChannel.EMAIL:
        await this.sendEmailCode(target, code, userId, type);
        break;
      case VerificationChannel.APP:
        // For in-app verification (push notifications)
        break;
    }

    return { code, token, expiresAt };
  }

  async verifyCode(
    token: string,
    code: string,
    type: VerificationType,
  ): Promise<{ success: boolean; message: string }> {
    const verification = await this.verificationRepository.findOne({
      where: { token, type, status: VerificationStatus.PENDING },
    });

    if (!verification) {
      throw new NotFoundException('Invalid verification token');
    }

    if (verification.isExpired()) {
      await this.verificationRepository.update(verification.id, {
        status: VerificationStatus.EXPIRED,
      });
      throw new BadRequestException('Verification code has expired');
    }

    if (verification.attempts >= this.maxAttempts) {
      await this.verificationRepository.update(verification.id, {
        status: VerificationStatus.FAILED,
      });
      throw new ForbiddenException('Too many failed attempts');
    }

    if (verification.code !== code) {
      await this.verificationRepository.increment(
        { id: verification.id },
        'attempts',
        1,
      );
      throw new BadRequestException('Invalid verification code');
    }

    // Mark as verified
    await this.verificationRepository.update(verification.id, {
      status: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
    });

    // Update user verification status based on type
    await this.updateUserVerificationStatus(verification.userId, type);

    return { success: true, message: 'Verification successful' };
  }

  private async updateUserVerificationStatus(
    userId: string,
    type: VerificationType,
  ): Promise<void> {
    const updateData: Partial<any> = {};

    switch (type) {
      case VerificationType.EMAIL:
        updateData.emailVerified = true;
        break;
      case VerificationType.PHONE:
        updateData.phoneVerified = true;
        break;
      case VerificationType.TWO_FACTOR:
        updateData.twoFactorEnabled = true;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await this.usersService.update(userId, updateData);
    }
  }

  async resendCode(
    token: string,
    userId: string,
  ): Promise<{ message: string }> {
    const verification = await this.verificationRepository.findOne({
      where: { token, status: VerificationStatus.PENDING },
    });

    if (!verification || verification.isExpired()) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    const newCode = this.generateCode();
    const expiresAt = new Date(Date.now() + this.codeExpiration * 1000);

    await this.verificationRepository.update(verification.id, {
      code: newCode,
      expiresAt,
      attempts: 0,
    });

    // Resend the code
    const channel =
      verification.type === VerificationType.PHONE
        ? VerificationChannel.SMS
        : VerificationChannel.EMAIL;

    if (channel === VerificationChannel.SMS) {
      await this.sendSmsCode(verification.target, newCode);
    } else {
      await this.sendEmailCode(
        verification.target,
        newCode,
        userId,
        verification.type,
      );
    }

    return { message: 'Verification code resent successfully' };
  }

  private async sendSmsCode(phone: string, code: string): Promise<void> {
    const message = `Your verification code is: ${code}. Valid for 15 minutes.`;
    await this.smsService.sendSms({
      number: phone,
      message,
      senderid: 'Marka',
    });
  }

  private async sendEmailCode(
    email: string,
    code: string,
    userId: string,
    type: VerificationType,
  ): Promise<void> {
    const subject = `Your Verification Code - ${type.toUpperCase()}`;
    const user = await this.usersService.findOne(userId);

    await this.emailService.sendEmail({
      to: email,
      subject: subject,
      template: 'email-verification',
      templateData: {
        firstName: user.firstName,
        verificationCode: code,
        expiresIn: 15,
        supportEmail: 'support@marka.ug',
      },
    });
  }

  async validateVerificationToken(
    token: string,
    type: VerificationType,
  ): Promise<boolean> {
    const verification = await this.verificationRepository.findOne({
      where: { token, type, status: VerificationStatus.VERIFIED },
    });

    return !!verification && !verification.isExpired();
  }

  async cleanupExpiredVerifications(): Promise<void> {
    await this.verificationRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('status = :status', { status: VerificationStatus.PENDING })
      .execute();
  }
}
