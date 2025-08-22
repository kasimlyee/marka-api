import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import { PaymentProvider, PaymentStatus, PaymentType } from './payment.entity';
import { Subscription } from '@marka/modules/subscriptions';

@Injectable()
export class PaymentService {
  private readonly paystackSecretKey: string;
  private readonly paystackBaseUrl: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly configService: ConfigService,
  ) {
    this.paystackSecretKey =
      this.configService.get('paystack.secretKey') ?? 'secret_key';
    this.paystackBaseUrl = 'https://api.paystack.co';
  }

  async create(
    createPaymentDto: CreatePaymentDto,
    tenantId: string,
  ): Promise<Payment> {
    // Generate payment reference
    const reference = this.generatePaymentReference();

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      reference,
      tenantId,
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(tenantId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, tenantId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async findByReference(reference: string, tenantId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { reference, tenantId },
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment with reference ${reference} not found`,
      );
    }
    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
    tenantId: string,
  ): Promise<Payment> {
    const payment = await this.findOne(id, tenantId);
    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const payment = await this.findOne(id, tenantId);
    await this.paymentRepository.remove(payment);
  }

  async initializePayment(paymentData: {
    amount: number;
    email: string;
    tenantId: string;
    subscriptionId?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    // Create payment record
    const payment = await this.create(
      {
        amount: paymentData.amount,
        provider: PaymentProvider.PAYSTACK,
        type: paymentData.subscriptionId
          ? PaymentType.SUBSCRIPTION
          : PaymentType.ONE_TIME,
        metadata: {
          ...paymentData.metadata,
          email: paymentData.email,
          subscriptionId: paymentData.subscriptionId,
        },
      },
      paymentData.tenantId,
    );

    // Initialize Paystack payment
    try {
      const response = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          amount: paymentData.amount * 100, // Paystack expects amount in kobo/cents
          email: paymentData.email,
          reference: payment.reference,
          metadata: {
            paymentId: payment.id,
            tenantId: paymentData.tenantId,
            subscriptionId: paymentData.subscriptionId,
            ...paymentData.metadata,
          },
          callback_url: `${this.configService.get('app.frontendUrl')}/payments/verify`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data;
    } catch (error) {
      // Update payment status to failed
      await this.update(
        payment.id,
        { status: PaymentStatus.FAILED },
        paymentData.tenantId,
      );
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  async verifyPayment(reference: string, tenantId: string): Promise<Payment> {
    // Find payment by reference
    const payment = await this.findByReference(reference, tenantId);

    // Verify with Paystack
    try {
      const response = await axios.get(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        },
      );

      const data = response.data.data;

      // Update payment record
      const updateData: UpdatePaymentDto = {
        status:
          data.status === 'success'
            ? PaymentStatus.SUCCESSFUL
            : PaymentStatus.FAILED,
        //providerPaymentId: data.id,
        //providerResponse: data,
      };

      if (data.status === 'success') {
        //updateData.paidAt = new Date();
        //updateData.fee = data.fee / 100; // Convert from kobo/cents to UGX
      }

      return this.update(payment.id, updateData, tenantId);
    } catch (error) {
      throw new BadRequestException('Failed to verify payment');
    }
  }

  async processSubscriptionPayment(subscription: Subscription): Promise<{
    success: boolean;
    reference?: string;
    message?: string;
  }> {
    try {
      // Get tenant details
      // In a real implementation, you would fetch the tenant details here

      // Initialize payment
      const paymentData = {
        amount: subscription.amount,
        email: 'tenant@example.com', // In a real implementation, get from tenant
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        metadata: {
          plan: subscription.plan,
          billingCycle: subscription.billingCycle,
        },
      };

      const result = await this.initializePayment(paymentData);

      return {
        success: true,
        reference: result.reference,
        message: 'Payment initialized successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async handlePaystackWebhook(payload: any): Promise<void> {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== payload.headers['x-paystack-signature']) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload.event;

    if (event === 'charge.success') {
      const data = payload.data;

      // Find payment by reference
      const payment = await this.paymentRepository.findOne({
        where: { reference: data.reference },
      });

      if (payment) {
        // Update payment status
        await this.update(
          payment.id,
          {
            status: PaymentStatus.SUCCESSFUL,
            //providerPaymentId: data.id,
            //providerResponse: data,
            //paidAt: new Date(),
            //fee: data.fee / 100, // Convert from kobo/cents to UGX
          },
          payment.tenantId,
        );
      }
    } else if (event === 'charge.failed') {
      const data = payload.data;

      // Find payment by reference
      const payment = await this.paymentRepository.findOne({
        where: { reference: data.reference },
      });

      if (payment) {
        // Update payment status
        await this.update(
          payment.id,
          {
            status: PaymentStatus.FAILED,
            // providerPaymentId: data.id,
            // providerResponse: data,
          },
          payment.tenantId,
        );
      }
    }
  }

  private generatePaymentReference(): string {
    // Generate a unique payment reference
    // Format: MK + timestamp + random 4 digits
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `MK${timestamp}${random}`;
  }
}
