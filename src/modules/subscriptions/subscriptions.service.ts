import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { TenantService } from '@marka/modules/tenants';
import { PaymentService } from '@marka/modules/payments';
import {
  SubscriptionStatus,
  BillingCycle,
  Subscription,
} from './subscription.entity';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { TenantPlan } from '@marka/common';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly tenantService: TenantService,
    private readonly paymentService: PaymentService,
    @InjectQueue('subscription-tasks') private subscriptionQueue: Queue,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
    tenantId: string,
  ): Promise<Subscription> {
    const tenant = await this.tenantService.findOne(tenantId);

    // Check if tenant already has an active subscription
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (activeSubscription) {
      throw new BadRequestException(
        'Tenant already has an active subscription',
      );
    }

    // Calculate end date based on billing cycle
    const startDate = new Date();
    let endDate = new Date();

    switch (createSubscriptionDto.billingCycle) {
      case BillingCycle.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BillingCycle.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Create subscription
    const subscription = this.subscriptionRepository.create({
      ...createSubscriptionDto,
      tenantId,
      startDate,
      endDate,
      status: SubscriptionStatus.PENDING,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findAll(tenantId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, tenantId },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
    tenantId: string,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id, tenantId);
    Object.assign(subscription, updateSubscriptionDto);
    return this.subscriptionRepository.save(subscription);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const subscription = await this.findOne(id, tenantId);
    await this.subscriptionRepository.remove(subscription);
  }

  async activateSubscription(
    id: string,
    tenantId: string,
    paymentReference?: string,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id, tenantId);

    // Update subscription status
    subscription.status = SubscriptionStatus.ACTIVE;
    if (paymentReference) {
      subscription.paymentReference = paymentReference;
    }

    // Update tenant plan
    await this.tenantService.update(tenantId, { plan: subscription.plan });

    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(
    id: string,
    tenantId: string,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id, tenantId);

    // Update subscription status
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();

    return this.subscriptionRepository.save(subscription);
  }

  async getActiveSubscription(tenantId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: {
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  async processSubscriptionPayment(
    id: string,
    tenantId: string,
  ): Promise<void> {
    const subscription = await this.findOne(id, tenantId);

    try {
      // Process payment with Paystack
      const paymentResult =
        await this.paymentService.processSubscriptionPayment(subscription);

      // Activate subscription if payment is successful
      if (paymentResult.success) {
        await this.activateSubscription(id, tenantId, paymentResult.reference);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      // Update subscription status to failed
      await this.update(id, { status: SubscriptionStatus.EXPIRED }, tenantId);
      throw error;
    }
  }

  async handlePaystackWebhook(payload: any): Promise<void> {
    // Handle Paystack webhook events
    const event = payload.event;

    if (event === 'charge.success') {
      const data = payload.data;
      const metadata = data.metadata;

      if (metadata && metadata.subscriptionId) {
        // Find subscription
        const subscription = await this.subscriptionRepository.findOne({
          where: { id: metadata.subscriptionId },
        });

        if (subscription) {
          // Activate subscription
          await this.activateSubscription(
            subscription.id,
            subscription.tenantId,
            data.reference,
          );
        }
      }
    } else if (event === 'subscription.disable') {
      const data = payload.data;
      const metadata = data.metadata;

      if (metadata && metadata.subscriptionId) {
        // Find subscription
        const subscription = await this.subscriptionRepository.findOne({
          where: { id: metadata.subscriptionId },
        });

        if (subscription) {
          // Cancel subscription
          await this.cancelSubscription(subscription.id, subscription.tenantId);
        }
      }
    }
  }

  async checkExpiringSubscriptions(): Promise<void> {
    // Find subscriptions that expire in the next 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const expiringSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: expiryDate,
      },
    });

    // Send renewal notifications
    for (const subscription of expiringSubscriptions) {
      // Add to queue for sending notification
      await this.subscriptionQueue.add('send-renewal-reminder', {
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
      });
    }
  }

  async processExpiredSubscriptions(): Promise<void> {
    // Find subscriptions that have expired
    const now = new Date();

    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: now,
      },
    });

    // Update status to expired
    for (const subscription of expiredSubscriptions) {
      await this.update(
        subscription.id,
        { status: SubscriptionStatus.EXPIRED },
        subscription.tenantId,
      );
    }
  }

  // Plan pricing
  getPlanPrices(): Record<TenantPlan, Record<BillingCycle, number>> {
    return {
      [TenantPlan.STANDARD]: {
        [BillingCycle.MONTHLY]: 50000, // 50,000 UGX
        [BillingCycle.QUARTERLY]: 135000, // 135,000 UGX (10% discount)
        [BillingCycle.YEARLY]: 480000, // 480,000 UGX (20% discount)
      },
      [TenantPlan.PRO]: {
        [BillingCycle.MONTHLY]: 100000, // 100,000 UGX
        [BillingCycle.QUARTERLY]: 270000, // 270,000 UGX (10% discount)
        [BillingCycle.YEARLY]: 960000, // 960,000 UGX (20% discount)
      },
      [TenantPlan.ENTERPRISE]: {
        [BillingCycle.MONTHLY]: 250000, // 250,000 UGX
        [BillingCycle.QUARTERLY]: 675000, // 675,000 UGX (10% discount)
        [BillingCycle.YEARLY]: 2400000, // 2,400,000 UGX (20% discount)
      },
    };
  }

  calculatePrice(plan: TenantPlan, billingCycle: BillingCycle): number {
    const prices = this.getPlanPrices();
    return prices[plan][billingCycle];
  }
}
