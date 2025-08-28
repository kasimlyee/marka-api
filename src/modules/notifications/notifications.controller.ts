import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant, Role } from '@marka/common';
import { Notification } from './notification.entity';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification successfully created',
  })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Tenant() tenant,
  ): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto, tenant.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Return all notifications' })
  async findAll(
    @Tenant() tenant,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ): Promise<Notification[]> {
    // In a real implementation, you would filter by category and status
    return this.notificationsService.findAll(tenant.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiResponse({ status: 200, description: 'Return the notification' })
  async findOne(
    @Param('id') id: string,
    @Tenant() tenant,
  ): Promise<Notification> {
    return this.notificationsService.findOne(id, tenant.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification successfully updated',
  })
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Tenant() tenant,
  ): Promise<Notification> {
    return this.notificationsService.update(
      id,
      updateNotificationDto,
      tenant.id,
    );
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id') id: string,
    @Tenant() tenant,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, tenant.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification successfully deleted',
  })
  async remove(@Param('id') id: string, @Tenant() tenant): Promise<void> {
    return this.notificationsService.remove(id, tenant.id);
  }

  @Post('report-ready')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send report ready notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendReportReadyNotification(
    @Body()
    data: {
      recipient: string;
      studentName: string;
      reportNo: string;
      downloadUrl: string;
    },
    @Tenant() tenant,
  ): Promise<Notification> {
    return this.notificationsService.sendReportReadyNotification(
      tenant.id,
      data.recipient,
      {
        studentName: data.studentName,
        reportNo: data.reportNo,
        downloadUrl: data.downloadUrl,
      },
    );
  }

  @Post('payment-received')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send payment received notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendPaymentReceivedNotification(
    @Body()
    data: {
      recipient: string;
      amount: number;
      reference: string;
      plan: string;
    },
    @Tenant() tenant,
  ): Promise<Notification> {
    return this.notificationsService.sendPaymentReceivedNotification(
      tenant.id,
      data.recipient,
      {
        amount: data.amount,
        reference: data.reference,
        plan: data.plan,
      },
    );
  }

  @Post('subscription-renewal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send subscription renewal notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendSubscriptionRenewalNotification(
    @Body()
    data: {
      recipient: string;
      plan: string;
      expiryDate: Date;
      renewalUrl: string;
    },
    @Tenant() tenant,
  ): Promise<Notification> {
    return this.notificationsService.sendSubscriptionRenewalNotification(
      tenant.id,
      data.recipient,
      {
        plan: data.plan,
        expiryDate: data.expiryDate,
        renewalUrl: data.renewalUrl,
      },
    );
  }
}
