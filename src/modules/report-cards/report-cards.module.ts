import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ReportCard } from './entities/report-card.entity';
import { ReportCardTemplate } from './entities/report-card-template.entity';
import { ReportCardController } from './report-cards.controller';
import { ReportCardService } from './report-cards.service';
import { ReportCardTemplateRepository } from './repository/report-card-template.repository';
import { ReportCardRepository } from './repository/report-card.repository';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { TemplateRendererService } from './services/template-renderer.service';
import { TemplateSeederService } from './services/template-seeder';
import { ReportGenerationProcessor } from './report-generation.processor';
import { GradingModule } from '../grading/grading.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { StudentsModule } from '../students/students.module';
import { SchoolsModule } from '../schools/schools.module';
//import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '@nestjs/cache-manager';
import redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportCard, ReportCardTemplate]),
    BullModule.registerQueue({
      name: 'report-generation',
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    GradingModule,
    AssessmentsModule,
    StudentsModule,
    SchoolsModule,
    UsersModule,
    // NotificationsModule,
    AuditModule,
  ],
  controllers: [ReportCardController],
  providers: [
    ReportCardService,
    ReportCardRepository,
    ReportCardTemplateRepository,
    PdfGeneratorService,
    TemplateRendererService,
    TemplateSeederService,
    ReportGenerationProcessor,
  ],
  exports: [ReportCardService, TemplateSeederService],
})
export class ReportCardModule {}
