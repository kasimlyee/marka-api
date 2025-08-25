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
import { PaymentService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles, RolesGuard, JwtAuthGuard } from '@marka/modules/auth';
import { Tenant, Role } from '@marka/common';
import { Payment } from './payment.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment successfully created' })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Tenant() tenant,
  ): Promise<Payment> {
    return this.paymentsService.create(createPaymentDto, tenant.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Return all payments' })
  async findAll(@Tenant() tenant): Promise<Payment[]> {
    return this.paymentsService.findAll(tenant.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Return the payment' })
  async findOne(@Param('id') id: string, @Tenant() tenant): Promise<Payment> {
    return this.paymentsService.findOne(id, tenant.id);
  }

  @Get('reference/:reference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a payment by reference' })
  @ApiResponse({ status: 200, description: 'Return the payment' })
  async findByReference(
    @Param('reference') reference: string,
    @Tenant() tenant,
  ): Promise<Payment> {
    return this.paymentsService.findByReference(reference, tenant.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a payment' })
  @ApiResponse({ status: 200, description: 'Payment successfully updated' })
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Tenant() tenant,
  ): Promise<Payment> {
    return this.paymentsService.update(id, updatePaymentDto, tenant.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiResponse({ status: 200, description: 'Payment successfully deleted' })
  async remove(@Param('id') id: string, @Tenant() tenant): Promise<void> {
    return this.paymentsService.remove(id, tenant.id);
  }

  @Post('initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize a payment' })
  @ApiResponse({ status: 200, description: 'Payment initialized successfully' })
  async initializePayment(
    @Body()
    paymentData: {
      amount: number;
      email: string;
      subscriptionId?: string;
      metadata?: Record<string, any>;
    },
    @Tenant() tenant,
  ) {
    return this.paymentsService.initializePayment({
      ...paymentData,
      tenantId: tenant.id,
    });
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify a payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  async verifyPayment(
    @Param('reference') reference: string,
    @Tenant() tenant,
  ): Promise<Payment> {
    return this.paymentsService.verifyPayment(reference, tenant.id);
  }

  @Post('webhook/paystack')
  @ApiOperation({ summary: 'Handle Paystack webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handlePaystackWebhook(@Body() payload: any): Promise<void> {
    return this.paymentsService.handlePaystackWebhook(payload);
  }
}
