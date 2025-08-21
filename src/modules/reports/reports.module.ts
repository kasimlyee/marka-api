import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './report.entity';
import { ReportTemplate } from './report-template.entity';
import { ReportsProcessor } from './reports.processor';
import { StudentsModule } from '@marka/modules/students';
import { AssessmentsModule } from '@marka/modules/assessments';
import { GradingModule } from '@marka/modules/grading';
import { TenantsModule } from '@marka/modules/tenants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportTemplate]),
    BullModule.registerQueue({
      name: 'report-generation',
    }),
    StudentsModule,
    AssessmentsModule,
    GradingModule,
    TenantsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
