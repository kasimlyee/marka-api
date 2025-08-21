import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { ImportService } from './import.service';

@Processor('import-processing')
export class ImportProcessor {
  constructor(private readonly importService: ImportService) {}

  @Process('process')
  async processImport(job: Job<{ jobId: string }>) {
    const { jobId } = job.data;
    try {
      await this.importService.processImportJob(jobId);
    } catch (error) {
      console.error(`Error processing import job ${jobId}:`, error);
      throw error;
    }
  }
}
