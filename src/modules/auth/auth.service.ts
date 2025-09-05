import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
//import { TenantService } from '../tenants/tenants.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Role } from '@marka/common';
import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { TenantResponseDto } from '../tenants/dto/tenant-response.dto';
import { UserStatus } from '../users/enums/user-status.enum';
import { VerificationService } from '../verification/verification.service';
import {
  VerificationType,
  VerificationChannel,
} from '../verification/verification.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly verificationService: VerificationService,
    //private readonly tenantService: TenantService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  async login(
    loginDto: LoginDto,
    tenantId?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // If tenantId is provided, verify the user belongs to that tenant
    if (tenantId && user.tenantId !== tenantId) {
      throw new UnauthorizedException('User does not belong to this tenant');
    }

    // Check if user email and phone are verified
    if (!user.isEmailVerified || !user.isPhoneVerified) {
      throw new ConflictException(
        'Please verify your email and phone before logging in',
      );
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    user.lastLoginAt = new Date();
    //user.lastLoginIp = loginDto.ip; Not provided in the DTO, you might need to pass it from the controller
    await this.userRepository.save(user);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME || '7d',
    });

    // Save refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(user.id, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists (outside transaction for read consistency)
      const existingUser = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Create Tenant
      const createTenantDto: CreateTenantDto = {
        name: registerDto.firstName + ' ' + registerDto.lastName,
        subdomain: registerDto.email.split('@')[0],
        contactEmail: registerDto.email,
        plan: registerDto.plan,
      };

      const tenant = await queryRunner.manager.save(
        queryRunner.manager.create(Tenant, createTenantDto),
      );

      // Create user with tenantId
      const user = await queryRunner.manager.save(
        queryRunner.manager.create(User, {
          ...registerDto,
          password: hashedPassword,
          role: Role.ADMIN,
          tenantId: tenant.id,
          isEmailVerified: false, // Ensure email is not verified initially
          isPhoneVerified: false, // Ensure phone is not verified initially
          status: UserStatus.PENDING,
        }),
      );

      await queryRunner.commitTransaction();

      // Initiate email and phone verification
      await this.initiateEmailVerification(user.id);
      if (user.phone) {
        await this.initiatePhoneVerification(user.id);
      }

      await this.verificationService.initiateVerification(
        user.id,
        VerificationType.EMAIL,
        user.email,
        VerificationChannel.EMAIL,
      );

      const userResponse = plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });

      const tenantResponse = plainToInstance(TenantResponseDto, tenant, {
        excludeExtraneousValues: true,
      });

      return {
        user: userResponse,
        tenant: tenantResponse,
        message: 'Registration successful',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Get user
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token hash
      const isRefreshTokenValid = await bcrypt.compare(
        refreshTokenDto.refreshToken,
        user.refreshTokenHash,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };

      const accessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME || '7d',
      });

      // Save new refresh token hash
      const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
      await this.usersService.update(user.id, { refreshTokenHash });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    // Clear refresh token hash
    await this.usersService.update(userId, { refreshTokenHash: undefined });
  }

  async initiateEmailVerification(
    userId: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Initiate email verification
    const result = await this.verificationService.initiateVerification(
      userId,
      VerificationType.EMAIL,
      user.email,
      VerificationChannel.EMAIL,
    );
    this.logger.log(
      `Verification code sent for  ${user.email} and will expire at ${result.expiresAt}`,
    );
    return { message: 'Verification code sent to your email' };
  }

  async verifyEmail(
    userId: string,
    token: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Verify the code
    const result = await this.verificationService.verifyCode(
      token,
      code,
      VerificationType.EMAIL,
    );

    if (result.success) {
      // Mark email as verified
      await this.markEmailAsVerified(user.email);
      return { success: true, message: 'Email verified successfully' };
    }

    return result;
  }

  async initiatePhoneVerification(
    userId: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.phone) {
      throw new BadRequestException('Phone number not set');
    }

    if (user.isPhoneVerified) {
      throw new BadRequestException('Phone is already verified');
    }

    // Initiate phone verification
    const result = await this.verificationService.initiateVerification(
      userId,
      VerificationType.PHONE,
      user.phone,
      VerificationChannel.SMS,
    );
    this.logger.log(
      `Verification code sent for  ${user.phone} and will expire at ${result.expiresAt}`,
    );
    return { message: 'Verification code sent to your phone' };
  }

  async verifyPhone(
    userId: string,
    token: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isPhoneVerified) {
      throw new BadRequestException('Phone is already verified');
    }

    // Verify the code
    const result = await this.verificationService.verifyCode(
      token,
      code,
      VerificationType.PHONE,
    );

    if (result.success) {
      // Mark phone as verified
      await this.markPhoneAsVerified(user.phone);
      return { success: true, message: 'Phone verified successfully' };
    }

    return result;
  }

  async resendVerificationCode(
    userId: string,
    type: VerificationType,
    token: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if already verified
    if (type === VerificationType.EMAIL && user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (type === VerificationType.PHONE && user.isPhoneVerified) {
      throw new BadRequestException('Phone is already verified');
    }

    // Resend the code
    const result = await this.verificationService.resendCode(token, userId);
    return result;
  }

  async markEmailAsVerified(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updateData: Partial<User> = {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    };

    // If both email and phone are verified, activate the account
    if (user.isPhoneVerified) {
      updateData.status = UserStatus.ACTIVE;
    }

    await this.userRepository.update(
      { email: email.toLowerCase() },
      updateData,
    );
  }

  async markPhoneAsVerified(phone: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updateData: Partial<User> = {
      isPhoneVerified: true,
      phoneVerifiedAt: new Date(),
    };

    // If both email and phone are verified, activate the account
    if (user.isEmailVerified) {
      updateData.status = UserStatus.ACTIVE;
    }

    await this.userRepository.update({ phone }, updateData);
  }

  async initiateTwoFactor(
    userId: string,
  ): Promise<{ secret: string; qrCode: string }> {
    // Implement two-factor authentication setup
    // This would generate a secret and QR code for the authenticator app
    throw new Error('Two-factor authentication not implemented');
  }

  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    // Implement two-factor token verification
    throw new Error('Two-factor authentication not implemented');
  }
}
