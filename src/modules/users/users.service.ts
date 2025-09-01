import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';
import { NotificationChannel } from '../notifications/enums/notification-channel.enum';
import { NotificationCategory } from '../notifications/enums/notification-category.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createUserDto: CreateUserDto, tenantId?: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      tenantId,
    });

    await this.userRepository.save(user);

    // Send welcome notification
    await this.notificationService.createNotification({
      title: 'Welcome to Marka!',
      content:
        'Your account has been created successfully. Please verify your email to get started.',
      channels: [NotificationChannel.EMAIL],
      category: NotificationCategory.ACCOUNT_ACTIVATION,
      recipient: user.email,
      template: 'welcome',
      context: {
        userName: user.firstName,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      },
    });

    return user;
  }

  async findAll(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
      ],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // If password is provided, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOne(userId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and update new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.update(userId, { password: hashedNewPassword });

    // Send password changed notification
    await this.notificationService.createNotification({
      title: 'Password Changed Successfully',
      content:
        'Your password has been changed successfully. If you did not initiate this change, please contact support immediately.',
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      category: NotificationCategory.PASSWORD_RESET,
      recipient: user.email,
      template: 'password-changed',
    });
  }
}
