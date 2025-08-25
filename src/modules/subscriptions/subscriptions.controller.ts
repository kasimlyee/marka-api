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
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
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
import { Subscription } from './subscription.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({
    status: 201,
    description: 'Subscription successfully created',
  })
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Tenant() tenant,
  ): Promise<Subscription> {
    return this.subscriptionsService.create(createSubscriptionDto, tenant.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'Return all subscriptions' })
  async findAll(@Tenant() tenant): Promise<Subscription[]> {
    return this.subscriptionsService.findAll(tenant.id);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active subscription' })
  @ApiResponse({ status: 200, description: 'Return active subscription' })
  async getActiveSubscription(@Tenant() tenant): Promise<Subscription | null> {
    return this.subscriptionsService.getActiveSubscription(tenant.id);
  }

  @Get('prices')
  @ApiOperation({ summary: 'Get subscription plan prices' })
  @ApiResponse({ status: 200, description: 'Return plan prices' })
  async getPlanPrices() {
    return this.subscriptionsService.getPlanPrices();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiResponse({ status: 200, description: 'Return the subscription' })
  async findOne(
    @Param('id') id: string,
    @Tenant() tenant,
  ): Promise<Subscription> {
    return this.subscriptionsService.findOne(id, tenant.id);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription activated successfully',
  })
  async activateSubscription(
    @Param('id') id: string,
    @Tenant() tenant,
    @Query('paymentReference') paymentReference?: string,
  ): Promise<Subscription> {
    return this.subscriptionsService.activateSubscription(
      id,
      tenant.id,
      paymentReference,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  async cancelSubscription(
    @Param('id') id: string,
    @Tenant() tenant,
  ): Promise<Subscription> {
    return this.subscriptionsService.cancelSubscription(id, tenant.id);
  }

  @Post('webhook/paystack')
  @ApiOperation({ summary: 'Handle Paystack webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handlePaystackWebhook(@Body() payload: any): Promise<void> {
    return this.subscriptionsService.handlePaystackWebhook(payload);
  }
}
