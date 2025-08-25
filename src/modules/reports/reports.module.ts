import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './report.entity';
import { ReportTemplate } from './report-template.entity';
import { ReportsProcessor } from './reports.processor';
import { StudentsModule } from '../students/students.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { GradingModule } from '../grading/grading.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportTemplate]),
    BullModule.registerQueue({
      name: 'report-generation',
    }),
    AssessmentsModule,
    GradingModule,
    TenantsModule,
    StudentsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
