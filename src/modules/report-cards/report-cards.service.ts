import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ReportCard, ReportCardStatus } from './entities/report-card.entity';
import { ReportCardTemplate } from './entities/report-card-template.entity';
import {
  GenerateReportCardDto,
  BulkGenerateReportCardDto,
} from './dto/generate-report-card.dto';
import { TemplateEngineService } from './services/template-engine.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { ReportCardDataService } from './services/report-card-data.service';

@Injectable()
export class ReportCardService {
  private readonly logger = new Logger(ReportCardService.name);

  constructor(
    @InjectRepository(ReportCard)
    private reportCardRepository: Repository<ReportCard>,
    @InjectRepository(ReportCardTemplate)
    private templateRepository: Repository<ReportCardTemplate>,
    @InjectQueue('report-generation')
    private reportQueue: Queue,
    private templateEngine: TemplateEngineService,
    private pdfGenerator: PdfGeneratorService,
    private reportDataService: ReportCardDataService,
  ) {}

  async generateReportCard(
    dto: GenerateReportCardDto,
    userId: string,
  ): Promise<ReportCard> {
    // Validate template exists and is active
    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId, status: 'active' },
      relations: ['school'],
    });

    if (!template) {
      this.logger.error(`Template not found or inactive: ${dto.templateId}`);
      throw new NotFoundException('Template not found or inactive');
    }

    // Create report card record
    const reportCard = this.reportCardRepository.create({
      title:
        dto.title ||
        `${dto.examLevel.toUpperCase()} Report - ${dto.academicYear} ${dto.term}`,
      examLevel: dto.examLevel,
      academicYear: dto.academicYear,
      term: dto.term,
      studentId: dto.studentId,
      schoolId: template.schoolId,
      templateId: dto.templateId,
      status: ReportCardStatus.GENERATING,
      generatedBy: userId,
    });

    const savedReportCard = await this.reportCardRepository.save(reportCard);

    // Queue the generation job
    await this.reportQueue.add(
      'generate-report-pdf',
      {
        reportCardId: savedReportCard.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(
      `Report card generation queued for student ${dto.studentId}`,
    );
    return savedReportCard;
  }

  async bulkGenerateReportCards(
    dto: BulkGenerateReportCardDto,
    userId: string,
  ): Promise<ReportCard[]> {
    const reportCards: ReportCard[] = [];

    for (const studentId of dto.studentIds) {
      const reportCard = await this.generateReportCard(
        {
          ...dto,
          studentId,
        },
        userId,
      );
      reportCards.push(reportCard);
    }

    return reportCards;
  }

  async processReportCardGeneration(reportCardId: string): Promise<void> {
    const reportCard = await this.reportCardRepository.findOne({
      where: { id: reportCardId },
      relations: ['template', 'student', 'school'],
    });

    if (!reportCard) {
      this.logger.error(`Report card not found: ${reportCardId}`);
      throw new NotFoundException('Report card not found');
    }

    try {
      // Prepare report data
      const reportData = await this.reportDataService.prepareReportCardData(
        reportCard.studentId,
        reportCard.examLevel,
        reportCard.academicYear,
        reportCard.term,
      );

      // Compile template
      const compiledTemplate = this.templateEngine.compileTemplate(
        reportCard.template.htmlTemplate,
      );

      // Render HTML
      const html = this.templateEngine.renderTemplate(compiledTemplate, {
        ...reportData,
        template: reportCard.template,
        generatedAt: new Date(),
      });

      // Generate PDF
      const fileName = `report_card_${reportCard.studentId}_${Date.now()}.pdf`;
      const { filePath, buffer } = await this.pdfGenerator.generatePdfFromHtml(
        html,
        {
          fileName,
          format: 'A4',
          orientation: 'portrait',
        },
      );

      // Update report card record
      await this.reportCardRepository.update(reportCardId, {
        status: ReportCardStatus.COMPLETED,
        pdfPath: filePath,
        generatedHtml: html,
        reportData: reportData as any,
        fileSize: `${(buffer.length / 1024).toFixed(2)} KB`,
        generatedAt: new Date(),
      });

      this.logger.log(`Report card generated successfully: ${fileName}`);
    } catch (error) {
      this.logger.error(
        `Report card generation failed: ${error.message}`,
        error.stack,
      );

      await this.reportCardRepository.update(reportCardId, {
        status: ReportCardStatus.FAILED,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  async getReportCards(
    filters: {
      schoolId?: string;
      studentId?: string;
      examLevel?: string;
      academicYear?: string;
      term?: string;
      status?: ReportCardStatus;
    },
    page: number = 1,
    limit: number = 20,
  ) {
    const queryBuilder = this.reportCardRepository
      .createQueryBuilder('reportCard')
      .leftJoinAndSelect('reportCard.student', 'student')
      .leftJoinAndSelect('reportCard.template', 'template')
      .leftJoinAndSelect('reportCard.school', 'school');

    if (filters.schoolId) {
      queryBuilder.andWhere('reportCard.schoolId = :schoolId', {
        schoolId: filters.schoolId,
      });
    }

    if (filters.studentId) {
      queryBuilder.andWhere('reportCard.studentId = :studentId', {
        studentId: filters.studentId,
      });
    }

    if (filters.examLevel) {
      queryBuilder.andWhere('reportCard.examLevel = :examLevel', {
        examLevel: filters.examLevel,
      });
    }

    if (filters.academicYear) {
      queryBuilder.andWhere('reportCard.academicYear = :academicYear', {
        academicYear: filters.academicYear,
      });
    }

    if (filters.term) {
      queryBuilder.andWhere('reportCard.term = :term', { term: filters.term });
    }

    if (filters.status) {
      queryBuilder.andWhere('reportCard.status = :status', {
        status: filters.status,
      });
    }

    queryBuilder
      .orderBy('reportCard.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async downloadReportCard(
    reportCardId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const reportCard = await this.reportCardRepository.findOne({
      where: { id: reportCardId, status: ReportCardStatus.COMPLETED },
      relations: ['student'],
    });

    if (!reportCard) {
      throw new NotFoundException('Report card not found or not completed');
    }

    if (!reportCard.pdfPath) {
      throw new BadRequestException('PDF file not available');
    }

    return {
      filePath: reportCard.pdfPath,
      fileName: `${reportCard.student.firstName}_${reportCard.student.lastName}_${reportCard.examLevel}_${reportCard.academicYear}_${reportCard.term}.pdf`,
    };
  }
}
