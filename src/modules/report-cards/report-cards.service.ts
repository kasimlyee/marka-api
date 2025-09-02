import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  ReportCard,
  ReportCardStatus,
  ReportCardType,
} from './entities/report-card.entity';
import { ReportCardTemplate } from './entities/report-card-template.entity';
import { ReportCardRepository } from './repository/report-card.repository';
import { ReportCardTemplateRepository } from './repository/report-card-template.repository';
import { CreateReportCardDto } from './dto/create-report-card.dto';
import { UpdateReportCardDto } from './dto/update-report-card.dto';
import { GenerateReportCardDto } from './dto/generate-report-card.dto';
import { CreateTemplateDto } from './dto/create-report-card-template.dto';
import { UpdateTemplateDto } from './dto/update-report-card-template.dto';
import { GradingService } from '../grading/grading.service';
import { AssessmentsService } from '../assessments/assessments.service';
import { StudentsService } from '../students/students.service';
import { SchoolsService } from '../schools/schools.service';
import { UsersService } from '../users/users.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { TemplateRendererService } from './services/template-renderer.service';
//import { CacheService } from '';
import { AuditService } from '../audit/audit.service';
//import { NotificationsService } from '../notifications/notifications.service';
import { ExamLevel } from '../assessments/assessment.entity';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ReportCardService {
  private readonly logger = new Logger(ReportCardService.name);

  constructor(
    private readonly reportCardRepository: ReportCardRepository,
    private readonly templateRepository: ReportCardTemplateRepository,
    private readonly gradingService: GradingService,
    private readonly assessmentsService: AssessmentsService,
    private readonly studentsService: StudentsService,
    private readonly schoolsService: SchoolsService,
    private readonly usersService: UsersService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly templateRendererService: TemplateRendererService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    //  private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    // private readonly notificationsService: NotificationsService,
    @InjectQueue('report-generation') private readonly reportQueue: Queue,
  ) {}

  async create(
    createDto: CreateReportCardDto,
    tenantId: string,
  ): Promise<ReportCard> {
    //get school from tenant id
    const school = await this.schoolsService.findByTenantId(tenantId);
    const schoolId = school.id;

    //get user from tenant id
    const user = await this.usersService.findByTenantId(tenantId);
    const userId = user.id;

    // Validate student exists and belongs to school
    const student = await this.studentsService.findOne(
      createDto.studentId,
      school.id,
    );

    if (!student || student.schoolId !== schoolId) {
      throw new BadRequestException(
        'Student not found or does not belong to this school',
      );
    }

    // Validate template exists and is compatible
    const template = await this.templateRepository.findOne({
      where: {
        id: createDto.templateId,
        examLevel: createDto.examLevel,
        isActive: true,
      },
    });
    if (!template) {
      throw new BadRequestException('Template not found or incompatible');
    }

    // Check for duplicate report card
    const existing = await this.reportCardRepository.findByStudentAndPeriod(
      createDto.studentId,
      createDto.examLevel,
      createDto.term,
      createDto.year,
    );
    if (existing) {
      throw new BadRequestException(
        'Report card already exists for this student and period',
      );
    }

    const reportCard = this.reportCardRepository.create({
      ...createDto,
      schoolId,
      generatedBy: userId,
      status: ReportCardStatus.DRAFT,
    });

    const saved = await this.reportCardRepository.save(reportCard);

    //await this.auditService.logCreate('CREATE', 'ReportCard', saved.id, userId);

    return saved;
  }

  async generateBulk(
    generateDto: GenerateReportCardDto,
    tenantId: string,
  ): Promise<{ jobIds: string[] }> {
    const { studentIds, examLevel, term, year, templateId } = generateDto;

    //get school from tenant id
    const school = await this.schoolsService.findByTenantId(tenantId);
    const schoolId = school.id;

    //get user from tenant id
    const user = await this.usersService.findByTenantId(tenantId);
    const userId = user.id;

    // Validate all students exist and belong to school
    const students = await this.studentsService.findByIds(studentIds, tenantId);
    const validStudentIds = students
      .filter((student) => student.schoolId === schoolId)
      .map((student) => student.id);

    if (validStudentIds.length !== studentIds.length) {
      throw new BadRequestException(
        'Some students not found or do not belong to this school',
      );
    }

    // Validate template
    const template = await this.templateRepository.findOne({
      where: { id: templateId, examLevel, isActive: true },
    });
    if (!template) {
      throw new BadRequestException('Template not found or incompatible');
    }

    const jobIds: string[] = [];

    // Create report cards and queue for generation
    for (const studentId of validStudentIds) {
      // Check if report card already exists
      const existing = await this.reportCardRepository.findByStudentAndPeriod(
        studentId,
        examLevel,
        term,
        year,
      );

      if (!existing) {
        const reportCard = this.reportCardRepository.create({
          title: `${examLevel.toUpperCase()} Term ${term} ${year} Report`,
          type: ReportCardType.TERMLY,
          examLevel,
          term,
          year,
          studentId,
          templateId,
          schoolId,
          generatedBy: userId,
          status: ReportCardStatus.PROCESSING,
        });

        const saved = await this.reportCardRepository.save(reportCard);

        // Queue for PDF generation
        const job = await this.reportQueue.add(
          'generate-pdf',
          {
            reportCardId: saved.id,
            userId,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        );

        jobIds.push(job.id.toString());
      }
    }

    //await this.auditService.log(
    //   'BULK_GENERATE',
    //    'ReportCard',
    //     `${jobIds.length} reports`,
    //    userId,
    //  );

    return { jobIds };
  }

  async generatePdf(reportCardId: string): Promise<ReportCard> {
    const reportCard = await this.reportCardRepository.findOne({
      where: { id: reportCardId },
      relations: ['student', 'school', 'template'],
    });

    if (!reportCard) {
      throw new NotFoundException('Report card not found');
    }

    try {
      // Update status to processing
      await this.reportCardRepository.update(reportCardId, {
        status: ReportCardStatus.PROCESSING,
      });

      // Get student assessments
      const assessments = await this.assessmentsService.findByStudentAndLevel(
        reportCard.studentId,
        reportCard.examLevel,
      );

      if (assessments.length === 0) {
        throw new BadRequestException('No assessments found for student');
      }

      // Calculate results using grading service
      let results: any;
      switch (reportCard.examLevel) {
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
          throw new BadRequestException('Unsupported exam level');
      }

      // Prepare template data
      const templateData = {
        reportCard,
        student: reportCard.student,
        school: reportCard.school,
        results,
        assessments,
        generatedAt: new Date(),
        term: reportCard.term,
        year: reportCard.year,
      };

      // Render HTML content
      const htmlContent = await this.templateRendererService.render(
        reportCard.template.htmlTemplate,
        templateData,
      );

      // Generate PDF
      const pdfPath = await this.pdfGeneratorService.generatePdf(
        htmlContent,
        `report-card-${reportCardId}`,
        {
          format: 'A4',
          printBackground: true,
          margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        },
      );

      // Update report card with generated content
      const updated = await this.reportCardRepository.save({
        ...reportCard,
        status: ReportCardStatus.COMPLETED,
        pdfPath,
        htmlContent,
        results,
      });

      // Send notification
      // await this.notificationsService.sendReportReadyNotification(
      //  reportCard.student.parentEmail || reportCard.student.email,
      //  reportCard.student.firstName + ' ' + reportCard.student.lastName,
      //  reportCard.title,
      // );

      // await this.auditService.log(
      //   'GENERATE_PDF',
      //   'ReportCard',
      //  reportCardId,
      //   userId,
      // );

      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF for report card ${reportCardId}:`,
        error,
      );

      await this.reportCardRepository.update(reportCardId, {
        status: ReportCardStatus.FAILED,
      });

      throw error;
    }
  }

  async findAll(schoolId: string, filters: any): Promise<ReportCard[]> {
    const cacheKey = `report-cards:${schoolId}:${JSON.stringify(filters)}`;

    let reportCards = await this.cacheManager.get<ReportCard[]>(cacheKey);

    if (!reportCards) {
      const queryBuilder = this.reportCardRepository
        .createQueryBuilder('reportCard')
        .leftJoinAndSelect('reportCard.student', 'student')
        .leftJoinAndSelect('reportCard.school', 'school')
        .leftJoinAndSelect('reportCard.template', 'template')
        .where('reportCard.schoolId = :schoolId', { schoolId });

      if (filters.status) {
        queryBuilder.andWhere('reportCard.status = :status', {
          status: filters.status,
        });
      }

      if (filters.examLevel) {
        queryBuilder.andWhere('reportCard.examLevel = :examLevel', {
          examLevel: filters.examLevel,
        });
      }

      if (filters.term) {
        queryBuilder.andWhere('reportCard.term = :term', {
          term: filters.term,
        });
      }

      if (filters.year) {
        queryBuilder.andWhere('reportCard.year = :year', {
          year: filters.year,
        });
      }

      if (filters.studentId) {
        queryBuilder.andWhere('reportCard.studentId = :studentId', {
          studentId: filters.studentId,
        });
      }

      reportCards = await queryBuilder
        .orderBy('reportCard.createdAt', 'DESC')
        .getMany();

      await this.cacheManager.set(cacheKey, reportCards, 300); // Cache for 5 minutes
    }

    return reportCards;
  }

  async findOne(id: string, schoolId: string): Promise<ReportCard> {
    const reportCard = await this.reportCardRepository.findOne({
      where: { id, schoolId },
      relations: ['student', 'school', 'template', 'generator'],
    });

    if (!reportCard) {
      throw new NotFoundException('Report card not found');
    }

    return reportCard;
  }

  async update(
    id: string,
    updateDto: UpdateReportCardDto,
    tenantId: string,
  ): Promise<ReportCard> {
    //get school from tenant id
    const school = await this.schoolsService.findByTenantId(tenantId);
    const schoolId = school.id;
    const reportCard = await this.findOne(id, schoolId);

    Object.assign(reportCard, updateDto);
    const updated = await this.reportCardRepository.save(reportCard);

    //  await this.auditService.log('UPDATE', 'ReportCard', id, userId);

    // Invalidate cache
    await this.cacheManager.del(`report-cards:${schoolId}:*`);

    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    //get school from tenant id
    const school = await this.schoolsService.findByTenantId(tenantId);
    const schoolId = school.id;
    const reportCard = await this.findOne(id, schoolId);

    // Delete PDF file if exists
    if (reportCard.pdfPath) {
      await this.pdfGeneratorService.deletePdf(reportCard.pdfPath);
    }

    await this.reportCardRepository.remove(reportCard);

    //await this.auditService.log('DELETE', 'ReportCard', id, userId);

    // Invalidate cache
    await this.cacheManager.del(`report-cards:${schoolId}:*`);
  }

  async downloadPdf(id: string, schoolId: string): Promise<string> {
    const reportCard = await this.findOne(id, schoolId);

    if (
      reportCard.status !== ReportCardStatus.COMPLETED ||
      !reportCard.pdfPath
    ) {
      throw new BadRequestException('PDF not available');
    }

    return reportCard.pdfPath;
  }

  // Template management methods
  async createTemplate(
    createDto: CreateTemplateDto,
    tenantId: string,
  ): Promise<ReportCardTemplate> {
    //get school from tenant id
    const school = await this.schoolsService.findByTenantId(tenantId);
    const schoolId = school.id;
    //get user from tenant id
    const user = await this.usersService.findByTenantId(tenantId);
    const userId = user.id;

    const template = this.templateRepository.create({
      ...createDto,
      schoolId,
      createdBy: userId,
    });

    const saved = await this.templateRepository.save(template);

    // await this.auditService.log(
    //  'CREATE',
    //  'ReportCardTemplate',
    //   saved.id,
    //   userId,
    //  );

    return saved;
  }

  async findTemplates(
    tenantId: string,
    examLevel?: ExamLevel,
  ): Promise<ReportCardTemplate[]> {
    //get school from tenant id
    const school = await this.schoolsService.findByTenantId(tenantId);
    const schoolId = school.id;
    return this.templateRepository.findActiveTemplates(examLevel, schoolId);
  }

  async updateTemplate(
    id: string,
    updateDto: UpdateTemplateDto,
  ): Promise<ReportCardTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    Object.assign(template, updateDto);
    const updated = await this.templateRepository.save(template);

    // await this.auditService.log('UPDATE', 'ReportCardTemplate', id, userId);

    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.templateRepository.remove(template);

    //  await this.auditService.log('DELETE', 'ReportCardTemplate', id, userId);
  }
}
