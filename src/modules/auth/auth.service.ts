import {
  Injectable,
  UnauthorizedException,
  ConflictException,
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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
        }),
      );

      await queryRunner.commitTransaction();

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
}
