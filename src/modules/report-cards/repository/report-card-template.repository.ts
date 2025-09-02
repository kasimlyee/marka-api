import { Repository, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ReportCardTemplate } from '../entities/report-card-template.entity';
import { ExamLevel } from '../../assessments/assessment.entity';

export class ReportCardTemplateRepository extends Repository<ReportCardTemplate> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(ReportCardTemplate, dataSource.createEntityManager());
  }

  async findActiveTemplates(
    examLevel?: ExamLevel,
    schoolId?: string,
  ): Promise<ReportCardTemplate[]> {
    const queryBuilder = this.createQueryBuilder('template').where(
      'template.isActive = :isActive',
      { isActive: true },
    );

    if (examLevel) {
      queryBuilder.andWhere('template.examLevel = :examLevel', { examLevel });
    }

    if (schoolId) {
      queryBuilder.andWhere(
        '(template.schoolId = :schoolId OR template.schoolId IS NULL)',
        { schoolId },
      );
    } else {
      queryBuilder.andWhere('template.schoolId IS NULL');
    }

    return queryBuilder.orderBy('template.isDefault', 'DESC').getMany();
  }

  async findDefaultTemplate(
    examLevel: ExamLevel,
    schoolId?: string,
  ): Promise<ReportCardTemplate | null> {
    const queryBuilder = this.createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true })
      .andWhere('template.isDefault = :isDefault', { isDefault: true })
      .andWhere('template.examLevel = :examLevel', { examLevel });

    if (schoolId) {
      queryBuilder.andWhere(
        '(template.schoolId = :schoolId OR template.schoolId IS NULL)',
        { schoolId },
      );
      queryBuilder.orderBy('template.schoolId', 'DESC'); // Prioritize school-specific templates
    } else {
      queryBuilder.andWhere('template.schoolId IS NULL');
    }

    return queryBuilder.getOne();
  }
}
