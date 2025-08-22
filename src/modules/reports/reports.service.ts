import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportTemplate } from './report-template.entity';
import { StudentsService } from '@marka/modules/students';
import { AssessmentsService } from '@marka/modules/assessments';
import { GradingService } from '@marka/modules/grading';
import { TenantService } from '@marka/modules/tenants';
import { ReportStatus, ExamLevel } from './report.entity';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as crypto from 'crypto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportTemplate)
    private readonly reportTemplateRepository: Repository<ReportTemplate>,
    private readonly studentsService: StudentsService,
    private readonly assessmentsService: AssessmentsService,
    private readonly gradingService: GradingService,
    private readonly tenantService: TenantService,
    @InjectQueue('report-generation') private reportGenerationQueue: Queue,
  ) {}

  async create(
    createReportDto: CreateReportDto,
    tenantId: string,
  ): Promise<Report> {
    // Validate student exists
    const student = await this.studentsService.findOne(
      createReportDto.studentId,
      tenantId,
    );

    // Validate template exists and is accessible to this tenant
    const template = await this.reportTemplateRepository.findOne({
      where: { id: createReportDto.templateId, tenantId },
    });
    if (!template) {
      throw new NotFoundException(
        `Report template not found or not accessible`,
      );
    }

    // Check if tenant's plan allows this template
    const tenant = await this.tenantService.findOne(tenantId);
    if (!this.isTemplateAccessible(tenant.plan, template.tierRequired)) {
      throw new BadRequestException(
        `This template requires ${template.tierRequired} plan or higher`,
      );
    }

    // Generate report number
    const reportNo = this.generateReportNumber();

    // Create report
    const report = this.reportRepository.create({
      ...createReportDto,
      reportNo,
      tenantId,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(report);

    // Add to queue for processing
    await this.reportGenerationQueue.add('generate', {
      reportId: savedReport.id,
      tenantId,
    });

    return savedReport;
  }

  async findAll(
    tenantId: string,
    studentId?: string,
    examLevel?: string,
  ): Promise<Report[]> {
    const where: any = { tenantId };
    if (studentId) where.studentId = studentId;
    if (examLevel) where.examLevel = examLevel;

    return this.reportRepository.find({
      where,
      relations: ['student', 'template'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, tenantId },
      relations: ['student', 'template'],
    });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    return report;
  }

  async findByReportNo(reportNo: string, tenantId: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { reportNo, tenantId },
      relations: ['student', 'template'],
    });
    if (!report) {
      throw new NotFoundException(`Report with number ${reportNo} not found`);
    }
    return report;
  }

  async update(
    id: string,
    updateReportDto: UpdateReportDto,
    tenantId: string,
  ): Promise<Report> {
    const report = await this.findOne(id, tenantId);
    Object.assign(report, updateReportDto);
    return this.reportRepository.save(report);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const report = await this.findOne(id, tenantId);
    await this.reportRepository.remove(report);
  }

  async generateReport(reportId: string, tenantId: string): Promise<void> {
    try {
      const report = await this.findOne(reportId, tenantId);

      // Update status to processing
      await this.update(
        reportId,
        { status: ReportStatus.PROCESSING },
        tenantId,
      );

      // Get student assessments for the exam level
      const assessments = await this.assessmentsService.findAll(
        tenantId,
        report.studentId,
        undefined,
        report.examLevel,
      );

      // Calculate results based on exam level
      let results;
      switch (report.examLevel) {
        case ExamLevel.PLE:
          results = this.gradingService.calculatePLEResults(assessments);
          break;
        case ExamLevel.UCE:
          results = this.gradingService.calculateUCEResults(assessments);
          break;
        case ExamLevel.UACE:
          results = this.gradingService.calculateUACEResults(assessments);
          break;
        default:
          throw new Error(`Unsupported exam level: ${report.examLevel}`);
      }

      // Update report with results
      //await this.update(reportId, { results }, tenantId);

      // Generate PDF (this would be handled by a separate PDF generation service)
      //const pdfUrl = await this.generatePdf(report, results);

      // Update report with PDF URL and mark as completed
      await this.update(
        reportId,
        {
          //pdfUrl,
          status: ReportStatus.COMPLETED,
        },
        tenantId,
      );
    } catch (error) {
      // Mark report as failed and store error message
      await this.update(
        reportId,
        {
          status: ReportStatus.FAILED,
          // errorMessage: error.message,
        },
        tenantId,
      );
      throw error;
    }
  }

  async getTemplates(tenantId: string): Promise<ReportTemplate[]> {
    const tenant = await this.tenantService.findOne(tenantId);

    // Get all templates for this tenant
    const templates = await this.reportTemplateRepository.find({
      where: { tenantId, isActive: true },
    });

    // Filter templates based on tenant's plan
    return templates.filter((template) =>
      this.isTemplateAccessible(tenant.plan, template.tierRequired),
    );
  }

  private generateReportNumber(): string {
    // Generate a unique report number
    // Format: RPT + year + random 8 digits
    const year = new Date().getFullYear().toString();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `RPT${year}${random}`;
  }

  private isTemplateAccessible(
    tenantPlan: string,
    templateTier: string,
  ): boolean {
    const planHierarchy = {
      standard: 1,
      pro: 2,
      enterprise: 3,
      lifetime: 4,
    };

    return planHierarchy[tenantPlan] >= planHierarchy[templateTier];
  }

  private async generatePdf(report: Report, results: any): Promise<string> {
    // This would integrate with a PDF generation service
    // For now, return a placeholder URL
    return `https://storage.marka.ug/reports/${report.id}.pdf`;
  }
}
