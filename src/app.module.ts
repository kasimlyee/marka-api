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
import { AuthModule } from '@marka/modules/auth';
import { TenantsModule } from '@marka/modules/tenants';
import { UsersModule } from '@marka/modules/users';
import { SchoolsModule } from '@marka/modules/schools/schools.module';
import { StudentsModule } from '@marka/modules/students';
import { SubjectsModule } from '@marka/modules/subjects';
import { GradingModule } from '@marka/modules/grading';
import { ReportsModule } from '@marka/modules/reports';
import { ImportModule } from '@marka/modules/import';
import { PaymentsModule } from '@marka/modules/payments';
import { SubscriptionsModule } from '@marka/modules/subscriptions';
import { NotificationsModule } from '@marka/modules/notifications';
import { AuditModule } from '@marka/modules/audit';
import { AssessmentsModule } from '@marka/modules/assessments';

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
        throttlers: [
          {
            ttl: configService.get('throttler.ttl') ?? 60,
            limit: configService.get('throttler.limit') ?? 10,
          },
        ],
      }),
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
