import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

import { ReportCard } from './entities/report-card.entity';
import { ReportCardTemplate } from './entities/report-card-template.entity';

import { ReportCardService } from './report-cards.service';
import { ReportCardTemplateService } from './report-card-template.service';
import { TemplateEngineService } from './services/template-engine.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { ReportCardDataService } from './services/report-card-data.service';

import { ReportCardController } from './report-cards.controller';
import { ReportCardTemplateController } from './report-card-template.controller';

import { ReportGenerationProcessor } from './report-generation.processor';

import { Student } from '../students/student.entity';
import { Assessment } from '../assessments/assessment.entity';
import { Subject } from '../subjects/subject.entity';
import { School } from '../schools/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportCard,
      ReportCardTemplate,
      Student,
      Assessment,
      Subject,
      School,
    ]),
    BullModule.registerQueue({
      name: 'report-generation',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    ConfigModule,
  ],
  controllers: [ReportCardController, ReportCardTemplateController],
  providers: [
    ReportCardService,
    ReportCardTemplateService,
    TemplateEngineService,
    PdfGeneratorService,
    ReportCardDataService,
    ReportGenerationProcessor,
  ],
  exports: [ReportCardService, ReportCardTemplateService],
})
export class ReportCardsModule {}
