import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { ReportsService } from './reports.service';

@Processor('report-generation')
export class ReportsProcessor {
  constructor(private readonly reportsService: ReportsService) {}

  @Process('generate')
  async generateReport(job: Job<{ reportId: string; tenantId: string }>) {
    const { reportId, tenantId } = job.data;
    try {
      await this.reportsService.generateReport(reportId, tenantId);
    } catch (error) {
      console.error(`Error generating report ${reportId}:`, error);
      throw error;
    }
  }
}
