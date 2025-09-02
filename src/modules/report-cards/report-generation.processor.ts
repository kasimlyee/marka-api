import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ReportCardService } from './report-cards.service';

@Processor('report-generation')
export class ReportGenerationProcessor {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(private reportCardService: ReportCardService) {}

  @Process('generate-report-pdf')
  async handleReportGeneration(job: Job<{ reportCardId: string }>) {
    this.logger.log(`Processing report generation job: ${job.id}`);

    try {
      await this.reportCardService.processReportCardGeneration(
        job.data.reportCardId,
      );
      this.logger.log(`Report generation completed for job: ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Report generation failed for job: ${job.id}`,
        error.stack,
      );
      throw error;
    }
  }
}
