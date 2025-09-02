import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReportCardTemplate,
  TemplateStatus,
  ExamLevel,
} from './entities/report-card-template.entity';
import { CreateReportCardTemplateDto } from './dto/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dto/update-report-card-template.dto';

@Injectable()
export class ReportCardTemplateService {
  constructor(
    @InjectRepository(ReportCardTemplate)
    private templateRepository: Repository<ReportCardTemplate>,
  ) {}

  async create(
    dto: CreateReportCardTemplateDto,
    schoolId: string,
    userId: string,
  ): Promise<ReportCardTemplate> {
    // Check if setting as default and there's already a default template
    if (dto.isDefault) {
      await this.ensureOnlyOneDefault(schoolId, dto.examLevel);
    }

    const template = this.templateRepository.create({
      ...dto,
      schoolId,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.templateRepository.save(template);
  }

  async findAll(
    schoolId: string,
    filters: {
      examLevel?: ExamLevel;
      status?: TemplateStatus;
      isDefault?: boolean;
    } = {},
    page: number = 1,
    limit: number = 20,
  ) {
    const queryBuilder = this.templateRepository
      .createQueryBuilder('template')
      .where('template.schoolId = :schoolId', { schoolId });

    if (filters.examLevel) {
      queryBuilder.andWhere('template.examLevel = :examLevel', {
        examLevel: filters.examLevel,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('template.status = :status', {
        status: filters.status,
      });
    }

    if (filters.isDefault !== undefined) {
      queryBuilder.andWhere('template.isDefault = :isDefault', {
        isDefault: filters.isDefault,
      });
    }

    queryBuilder
      .orderBy('template.isDefault', 'DESC')
      .addOrderBy('template.updatedAt', 'DESC')
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

  async findOne(id: string, schoolId: string): Promise<ReportCardTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, schoolId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(
    id: string,
    dto: UpdateReportCardTemplateDto,
    schoolId: string,
    userId: string,
  ): Promise<ReportCardTemplate> {
    const template = await this.findOne(id, schoolId);

    // Check if setting as default and there's already a default template
    if (dto.isDefault && !template.isDefault) {
      await this.ensureOnlyOneDefault(schoolId, template.examLevel);
    }

    Object.assign(template, dto, { updatedBy: userId, updatedAt: new Date() });
    return this.templateRepository.save(template);
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const template = await this.findOne(id, schoolId);

    // Check if template is being used
    const usageCount = await this.templateRepository
      .createQueryBuilder('template')
      .leftJoin('template.reportCards', 'reportCard')
      .where('template.id = :id', { id })
      .getCount();

    if (usageCount > 0) {
      throw new ConflictException(
        'Cannot delete template that is being used by report cards',
      );
    }

    await this.templateRepository.remove(template);
  }

  async activate(id: string, schoolId: string): Promise<ReportCardTemplate> {
    const template = await this.findOne(id, schoolId);
    template.status = TemplateStatus.ACTIVE;
    return this.templateRepository.save(template);
  }

  async archive(id: string, schoolId: string): Promise<ReportCardTemplate> {
    const template = await this.findOne(id, schoolId);
    template.status = TemplateStatus.ARCHIVED;
    return this.templateRepository.save(template);
  }

  async clone(
    id: string,
    schoolId: string,
    userId: string,
    newName?: string,
  ): Promise<ReportCardTemplate> {
    const originalTemplate = await this.findOne(id, schoolId);

    const clonedTemplate = this.templateRepository.create({
      ...originalTemplate,
      id: undefined, // Let TypeORM generate new ID
      name: newName || `${originalTemplate.name} (Copy)`,
      status: TemplateStatus.DRAFT,
      isDefault: false,
      version: '1.0',
      createdBy: userId,
      updatedBy: userId,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.templateRepository.save(clonedTemplate);
  }

  private async ensureOnlyOneDefault(
    schoolId: string,
    examLevel: ExamLevel,
  ): Promise<void> {
    await this.templateRepository.update(
      { schoolId, examLevel, isDefault: true },
      { isDefault: false },
    );
  }

  async getDefaultTemplate(
    schoolId: string,
    examLevel: ExamLevel,
  ): Promise<ReportCardTemplate | null> {
    return this.templateRepository.findOne({
      where: {
        schoolId,
        examLevel,
        isDefault: true,
        status: TemplateStatus.ACTIVE,
      },
    });
  }
}
