import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ReportCardService } from './report-cards.service';

export interface ReportGenerationJob {
  reportCardId: string;
  userId: string;
}

@Processor('report-generation')
export class ReportGenerationProcessor {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(private readonly reportCardService: ReportCardService) {}

  @Process('generate-pdf')
  async handlePdfGeneration(job: Job<ReportGenerationJob>): Promise<void> {
    const { reportCardId, userId } = job.data;

    this.logger.log(
      `Processing PDF generation for report card: ${reportCardId}`,
    );

    try {
      await this.reportCardService.generatePdf(reportCardId);
      this.logger.log(
        `PDF generation completed for report card: ${reportCardId}`,
      );
    } catch (error) {
      this.logger.error(
        `PDF generation failed for report card: ${reportCardId}`,
        error,
      );
      throw error;
    }
  }
}
