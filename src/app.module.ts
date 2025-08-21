import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './modules/auth/auth.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ImportModule } from './modules/import/import.module';
import { ReportsModule } from './modules/reports/reports.module';
import { GradingModule } from './modules/grading/grading.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { StudentsModule } from './modules/students/students.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { UsersModule } from './modules/users/users.module';
import {TenantsModule} from '@marka/modules/tenants';
import { UsersModule } from './modules/users/users.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { StudentsModule } from './modules/students/students.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { GradingModule } from './modules/grading/grading.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ImportModule } from './modules/import/import.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';

import {
  appConfig,
  databaseConfig,
  jwtConfig,
  paystackConfig,
  storageConfig,
} from '@marka/config';
import { AuthModule } from './modules/auth/auth.module';


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
        ttl: configService.get('throttler.ttl'),
        limit: configService.get('throttler.limit'),
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
    ReportsModule,
    ImportModule,
    PaymentsModule,
    SubscriptionsModule,
    NotificationsModule,
    AuditModule,
    AssessmentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
