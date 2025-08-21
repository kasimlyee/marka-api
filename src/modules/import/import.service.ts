import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/student.entity';
import { Subject } from '../subjects/subject.entity';
import { Assessment } from '../assessments/assessment.entity';
//import { CreateStudentDto } from '../students/dto/create-student.dto';
//import { CreateAssessmentDto } from '../assessments/dto/create-assessment.dto';
//import * as csv from 'csv-parser';
//import * as XLSX from 'xlsx';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Tenant } from '@marka/modules/tenants';
import { ImportJob } from './import-job.entity';
//import { ExamLevel, AssessmentType } from '../assessments/assessment.entity';

export interface ImportResult {
  success: boolean;
  message: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors?: string[];
  downloadUrl?: string;
}

export interface ImportData {
  tenantId: string;
  type: 'students' | 'assessments';
  file: Express.Multer.File;
  userId: string;
}

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    @InjectRepository(ImportJob)
    private readonly importJobRepository: Repository<ImportJob>,
    @InjectQueue('import-processing') private importQueue: Queue,
  ) {}

  async createImportJob(data: ImportData, tenant: Tenant): Promise<ImportJob> {
    const importJob = this.importJobRepository.create({
      tenantId: tenant.id,
      type: data.type,
      fileName: data.file.originalname,
      fileSize: data.file.size,
      status: 'pending',
      userId: data.userId,
    });

    const savedJob = await this.importJobRepository.save(importJob);

    // Add to queue for processing
    await this.importQueue.add('process', {
      jobId: savedJob.id,
      filePath: data.file.path,
      tenantId: tenant.id,
      type: data.type,
      userId: data.userId,
    });

    return savedJob;
  }

  async processImportJob(jobId: string): Promise<void> {
    const job = await this.importJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Import job with ID ${jobId} not found`);
    }

    try {
      // Update status to processing
      await this.importJobRepository.update(jobId, { status: 'processing' });

      // Process the file based on type
      let result: ImportResult;
      if (job.type === 'students') {
        result = await this.processStudentsImport(job);
      } else if (job.type === 'assessments') {
        result = await this.processAssessmentsImport(job);
      } else {
        throw new Error(`Unsupported import type: ${job.type}`);
      }

      // Update job with results
      await this.importJobRepository.update(jobId, {
        status: 'completed',
        result,
        completedAt: new Date(),
      });
    } catch (error) {
      // Update job with error
      await this.importJobRepository.update(jobId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private async processStudentsImport(job: ImportJob): Promise<ImportResult> {
    // This would read the file and process student records
    // For now, return a placeholder result
    return {
      success: true,
      message: 'Students imported successfully',
      totalRecords: 100,
      processedRecords: 95,
      failedRecords: 5,
      errors: ['Invalid LIN for record 23', 'Missing first name for record 45'],
    };
  }

  private async processAssessmentsImport(job: ImportJob): Promise<ImportResult> {
    // This would read the file and process assessment records
    // For now, return a placeholder result
    return {
      success: true,
      message: 'Assessments imported successfully',
      totalRecords: 500,
      processedRecords: 480,
      failedRecords: 20,
      errors: ['Invalid score for record 123', 'Subject not found for record 456'],
    };
  }

  async getImportJobs(tenantId: string): Promise<ImportJob[]> {
    return this.importJobRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getImportJob(id: string, tenantId: string): Promise<ImportJob> {
    const job = await this.importJobRepository.findOne({
      where: { id, tenantId },
    });
    if (!job) {
      throw new Error(`Import job with ID ${id} not found`);
    }
    return job;
  }

  // Helper methods for parsing different file formats
  private parseCsvFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      // This would use fs.createReadStream to read the file
      // For now, return empty array
      resolve(results);
    });
  }

  private parseExcelFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // This would use XLSX.readFile to read the file
      // For now, return empty array
      resolve([]);
    });
  }

  // Validation methods
  private validateStudentRecord(record: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!record.firstName) errors.push('First name is required');
    if (!record.lastName) errors.push('Last name is required');
    // Add more validation as needed

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateAssessmentRecord(record: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!record.studentId) errors.push('Student ID is required');
    if (!record.subjectId) errors.push('Subject ID is required');
    if (record.caScore === undefined && record.examScore === undefined) {
      errors.push('At least one score (CA or exam) is required');
    }
    // Add more validation as needed

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}