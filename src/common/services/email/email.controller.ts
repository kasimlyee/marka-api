import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { EmailQueueService } from './email-queue.service';
import { EmailTemplateService } from './email-template.service';
import { EmailAnalyticsService } from './email-analytics.service';
import { SendEmailDto, ScheduleEmailDto, BulkEmailDto } from './dto/email.dto';
import { RolesGuard } from '../../../modules/auth/guards/roles.guard';
import { Roles } from '../../../modules/auth/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly queueService: EmailQueueService,
    private readonly templateService: EmailTemplateService,
    private readonly analyticsService: EmailAnalyticsService,
  ) {}

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email immediately' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async sendEmail(@Body(ValidationPipe) sendEmailDto: SendEmailDto) {
    return this.emailService.sendEmail(sendEmailDto);
  }

  @Post('queue')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Add email to queue' })
  @ApiResponse({ status: 202, description: 'Email queued successfully' })
  async queueEmail(@Body(ValidationPipe) sendEmailDto: SendEmailDto) {
    const jobId = await this.queueService.addToQueue(sendEmailDto);
    return { jobId, status: 'queued' };
  }

  @Post('schedule')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Schedule email for later delivery' })
  async scheduleEmail(
    @Body(ValidationPipe) scheduleEmailDto: ScheduleEmailDto,
  ) {
    const { scheduleDate, ...emailOptions } = scheduleEmailDto;
    const jobId = await this.queueService.scheduleEmail(
      emailOptions,
      new Date(scheduleDate),
    );
    return { jobId, status: 'scheduled', scheduleDate };
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send bulk emails' })
  async sendBulkEmails(@Body(ValidationPipe) bulkEmailDto: BulkEmailDto) {
    const jobIds = await this.queueService.addBulkToQueue(bulkEmailDto.emails);
    return { jobIds, status: 'queued', count: bulkEmailDto.emails.length };
  }

  @Get('templates')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all email templates' })
  async getTemplates() {
    return this.templateService.getAllTemplates();
  }

  @Get('templates/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get email template by ID' })
  async getTemplate(@Param('id') id: string) {
    return this.templateService.getTemplate(id);
  }

  @Get('queue/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get email queue statistics' })
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  @Get('analytics/:messageId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get email analytics by message ID' })
  async getEmailAnalytics(@Param('messageId') messageId: string) {
    return this.analyticsService.getAnalytics(messageId);
  }

  @Get('analytics/daily/:date')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get daily email analytics' })
  async getDailyAnalytics(@Param('date') date: string) {
    return this.analyticsService.getDailyAnalytics(new Date(date));
  }

  @Get('health')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Check email service health' })
  async healthCheck() {
    const isConnected = await this.emailService.testConnection();
    const queueStats = await this.queueService.getQueueStats();

    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      smtp: isConnected,
      queue: queueStats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('track/open/:trackingId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track email open (pixel endpoint)' })
  async trackOpen(
    @Param('trackingId') trackingId: string,
    @Query() query: any,
  ) {
    // Track the email open
    await this.analyticsService.trackOpened(
      trackingId,
      query.userAgent,
      query.ip,
    );

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );
    return pixel;
  }
}
