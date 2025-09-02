import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  paystackConfig,
  storageConfig,
} from '@marka/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { StudentsModule } from './modules/students/students.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { GradingModule } from './modules/grading/grading.module';
//import { ReportsModule } from '@marka/modules/reports';
import { ImportModule } from './modules/import/import.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

import { AuditModule } from './modules/audit/audit.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoreModule } from './modules/store/store.module';
import { EmailModule } from './common/services/email/email.module';
import { SmsModule } from './common/services/sms/sms.module';
import { ReportCardsModule } from './modules/report-cards/report-cards.module';
import emailConfig from './config/email.config';
import smsConfig from './config/sms.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        appConfig,
        jwtConfig,
        paystackConfig,
        storageConfig,
        emailConfig,
        smsConfig,
      ],
      envFilePath: ['.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          autoLoadEntities: true,
          synchronize: false, // Should be false in production
          logging: dbConfig.logging,
          ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
        } as TypeOrmModuleOptions;
      },
      inject: [ConfigService],
    }),

    // Queue
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),

    // Throttling
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: 60,
            limit: 10,
          },
        ],
      }),
    }),
    SmsModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        username: configService.get('SMS_USERNAME') ?? '',
        password: configService.get('SMS_PASSWORD') ?? '',
        defaultSenderId: configService.get('SMS_DEFAULT_SENDER_ID') ?? '',
        defaultPriority: configService.get('SMS_DEFAULT_PRIORITY', 2),
        isSandbox: configService.get('SMS_SANDBOX_MODE', true),
        timeout: configService.get('SMS_TIMEOUT', 10000),
        maxRetries: configService.get('SMS_MAX_RETRIES', 3),
        retryDelay: configService.get('SMS_RETRY_DELAY', 1000),
      }),
      inject: [ConfigService],
    }),
    // Scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    TenantsModule,
    UsersModule,
    SchoolsModule,
    StudentsModule,
    SubjectsModule,
    GradingModule,
    // ReportsModule,
    ImportModule,
    PaymentsModule,
    SubscriptionsModule,
    AuditModule,
    AssessmentsModule,
    StoreModule,
    //services
    EmailModule,
    ReportCardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
