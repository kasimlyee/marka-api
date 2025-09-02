import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ReportCard, ReportCardStatus } from '../entities/report-card.entity';
import { ExamLevel } from '../../assessments/assessment.entity';

@Injectable()
export class ReportCardRepository extends Repository<ReportCard> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(ReportCard, dataSource.createEntityManager());
  }

  async findByStudentAndPeriod(
    studentId: string,
    examLevel: ExamLevel,
    term: number,
    year: number,
  ): Promise<ReportCard | null> {
    return this.findOne({
      where: { studentId, examLevel, term, year },
      relations: ['student', 'school', 'template'],
    });
  }

  async findBySchoolAndPeriod(
    schoolId: string,
    examLevel: ExamLevel,
    term: number,
    year: number,
    status?: ReportCardStatus,
  ): Promise<ReportCard[]> {
    const queryBuilder = this.createQueryBuilder('reportCard')
      .leftJoinAndSelect('reportCard.student', 'student')
      .leftJoinAndSelect('reportCard.school', 'school')
      .leftJoinAndSelect('reportCard.template', 'template')
      .where('reportCard.schoolId = :schoolId', { schoolId })
      .andWhere('reportCard.examLevel = :examLevel', { examLevel })
      .andWhere('reportCard.term = :term', { term })
      .andWhere('reportCard.year = :year', { year });

    if (status) {
      queryBuilder.andWhere('reportCard.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async findPendingGeneration(limit: number = 10): Promise<ReportCard[]> {
    return this.find({
      where: { status: ReportCardStatus.PROCESSING },
      relations: ['student', 'school', 'template'],
      take: limit,
      order: { createdAt: 'ASC' },
    });
  }

  async updateBulkStatus(
    ids: string[],
    status: ReportCardStatus,
  ): Promise<void> {
    await this.update(ids, { status });
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<ReportCard>,
    filters: any,
  ): SelectQueryBuilder<ReportCard> {
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

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'reportCard.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    return queryBuilder;
  }
}
