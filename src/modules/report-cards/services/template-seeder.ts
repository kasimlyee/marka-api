import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReportCardTemplate,
  ExamLevel,
  TemplateStatus,
} from '../entities/report-card-template.entity';
import {
  DEFAULT_PLE_TEMPLATE,
  DEFAULT_UCE_TEMPLATE,
} from '../../../templates/reports/default-templates';

@Injectable()
export class TemplateSeederService {
  constructor(
    @InjectRepository(ReportCardTemplate)
    private templateRepository: Repository<ReportCardTemplate>,
  ) {}

  async seedDefaultTemplates(schoolId: string, userId: string): Promise<void> {
    const templates = [
      {
        name: 'Default PLE Template',
        description:
          'Standard PLE report card template compliant with UNEB requirements',
        htmlTemplate: DEFAULT_PLE_TEMPLATE,
        examLevel: ExamLevel.PLE,
        status: TemplateStatus.ACTIVE,
        isDefault: true,
        version: '1.0',
        schoolId,
        createdBy: userId,
        updatedBy: userId,
        templateVariables: {
          student: 'Student information object',
          school: 'School information object',
          assessments: 'Array of assessment objects',
          statistics: 'Calculated statistics object',
          academicYear: 'Academic year string',
          term: 'Term string',
          examLevel: 'Exam level string',
          generatedAt: 'Generation timestamp',
        },
        styling: {
          primaryColor: '#0066cc',
          secondaryColor: '#e0e0e0',
          fontFamily: 'Times New Roman',
          fontSize: '12px',
        },
      },
      {
        name: 'Default UCE Template',
        description:
          'Standard UCE report card template compliant with UNEB requirements',
        htmlTemplate: DEFAULT_UCE_TEMPLATE,
        examLevel: ExamLevel.UCE,
        status: TemplateStatus.ACTIVE,
        isDefault: true,
        version: '1.0',
        schoolId,
        createdBy: userId,
        updatedBy: userId,
        templateVariables: {
          student: 'Student information object',
          school: 'School information object',
          assessments: 'Array of assessment objects',
          statistics: 'Calculated statistics object',
          academicYear: 'Academic year string',
          term: 'Term string',
          examLevel: 'Exam level string',
          generatedAt: 'Generation timestamp',
        },
        styling: {
          primaryColor: '#0066cc',
          secondaryColor: '#e0e0e0',
          fontFamily: 'Times New Roman',
          fontSize: '12px',
        },
      },
    ];

    for (const templateData of templates) {
      const existingTemplate = await this.templateRepository.findOne({
        where: {
          schoolId,
          examLevel: templateData.examLevel,
          isDefault: true,
        },
      });

      if (!existingTemplate) {
        const template = this.templateRepository.create(templateData);
        await this.templateRepository.save(template);
      }
    }
  }
}
