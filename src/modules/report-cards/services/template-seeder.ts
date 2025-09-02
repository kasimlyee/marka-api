import { Injectable, Logger } from '@nestjs/common';
import { ReportCardTemplateRepository } from '../repository/report-card-template.repository';
import { ExamLevel } from '../../assessments/assessment.entity';
import { DEFAULT_PLE_TEMPLATE } from '../../../templates/reports/default-templates';

@Injectable()
export class TemplateSeederService {
  private readonly logger = new Logger(TemplateSeederService.name);

  constructor(
    private readonly templateRepository: ReportCardTemplateRepository,
  ) {}

  async seedDefaultTemplates(): Promise<void> {
    try {
      const templates = [
        {
          name: 'Default PLE Template',
          description: 'Standard PLE report card template',
          examLevel: ExamLevel.PLE,
          htmlTemplate: DEFAULT_PLE_TEMPLATE,
          isDefault: true,
          isActive: true,
        },
        /**{
          name: 'Default UCE Template',
          description: 'Standard UCE report card template',
          examLevel: ExamLevel.UCE,
          htmlTemplate: DEFAULT_UCE_TEMPLATE,
          isDefault: true,
          isActive: true,
        },
       {
          name: 'Default UACE Template',
          description: 'Standard UACE report card template',
          examLevel: ExamLevel.UACE,
          htmlTemplate: DEFAULT_UACE_TEMPLATE,
          isDefault: true,
          isActive: true,
        },*/
      ];

      for (const templateData of templates) {
        const existing = await this.templateRepository.findOne({
          where: {
            name: templateData.name,
            examLevel: templateData.examLevel,
          },
        });

        if (!existing) {
          const template = this.templateRepository.create(templateData);
          await this.templateRepository.save(template);
          this.logger.log(`Created default template: ${templateData.name}`);
        }
      }

      this.logger.log('Default templates seeded successfully');
    } catch (error) {
      this.logger.error('Failed to seed default templates:', error);
      throw error;
    }
  }
}
