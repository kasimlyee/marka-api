import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from './assessment.entity';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { GradingService } from '../grading/grading.service';
import { Grade, ExamLevel } from './assessment.entity';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    private readonly gradingService: GradingService,
  ) {}

  async create(
    createAssessmentDto: CreateAssessmentDto,
    tenantId: string,
  ): Promise<Assessment | null> {
    // Calculate total score if both scores are provided
    let totalScore: number | null = null;
    if (
      createAssessmentDto.caScore != null &&
      createAssessmentDto.examScore != null
    ) {
      totalScore = createAssessmentDto.caScore + createAssessmentDto.examScore;
    }

    // Calculate grade and points based on exam level
    let grade: string | null = null;
    let points: number | null = null;
    if (totalScore !== null) {
      const gradingResult = this.gradingService.calculateGrade(
        totalScore,
        createAssessmentDto.examLevel,
      );
      grade = gradingResult.grade;
      points = gradingResult.points;
    }

    /** const assessment = this.assessmentRepository.create({
      ...createAssessmentDto,
      totalScore,
      grade,
      points,
      tenantId,
    });

    return this.assessmentRepository.save(assessment);*/
    return null;
  }

  async findAll(
    tenantId: string,
    studentId?: string,
    subjectId?: string,
    examLevel?: string,
  ): Promise<Assessment[]> {
    const where: any = { tenantId };
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (examLevel) where.examLevel = examLevel;

    return this.assessmentRepository.find({
      where,
      relations: ['student', 'subject'],
    });
  }

  async findOne(id: string, tenantId: string): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id, tenantId },
      relations: ['student', 'subject'],
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }
    return assessment;
  }

  async findByStudentAndLevel(
    studentId: string,
    examLevel: ExamLevel,
  ): Promise<Assessment[]> {
    const assessments = await this.assessmentRepository.find({
      where: { studentId, examLevel },
    });
    if (!assessments) {
      throw new NotFoundException(
        `Assessment with student ID ${studentId} and exam level ${examLevel} not found`,
      );
    }
    return assessments;
  }

  async update(
    id: string,
    updateAssessmentDto: UpdateAssessmentDto,
    tenantId: string,
  ): Promise<Assessment> {
    const assessment = await this.findOne(id, tenantId);

    // Calculate total score if both scores are provided
    let totalScore = assessment.totalScore;
    if (
      updateAssessmentDto.caScore !== undefined &&
      updateAssessmentDto.examScore !== undefined
    ) {
      totalScore = updateAssessmentDto.caScore + updateAssessmentDto.examScore;
    } else if (
      updateAssessmentDto.caScore !== undefined &&
      assessment.examScore !== null
    ) {
      totalScore = updateAssessmentDto.caScore + assessment.examScore;
    } else if (
      updateAssessmentDto.examScore !== undefined &&
      assessment.caScore !== null
    ) {
      totalScore = assessment.caScore + updateAssessmentDto.examScore;
    }

    // Calculate grade and points based on exam level
    let grade = assessment.grade;
    let points = assessment.points;
    if (totalScore !== null) {
      const gradingResult = this.gradingService.calculateGrade(
        totalScore,
        assessment.examLevel,
      );
      grade = gradingResult.grade as Grade;
      points = gradingResult.points;
    }

    Object.assign(assessment, {
      ...updateAssessmentDto,
      totalScore,
      grade,
      points,
    });

    return this.assessmentRepository.save(assessment);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const assessment = await this.findOne(id, tenantId);
    await this.assessmentRepository.remove(assessment);
  }

  async calculateStudentResults(
    studentId: string,
    tenantId: string,
    examLevel: ExamLevel,
  ) {
    // Get all assessments for the student for the given exam level
    const assessments = await this.findAll(
      tenantId,
      studentId,
      undefined,
      examLevel,
    );

    // Calculate results based on exam level
    switch (examLevel) {
      case ExamLevel.PLE:
        return this.gradingService.calculatePLEResults(assessments);
      case ExamLevel.UCE:
        return this.gradingService.calculateUCEResults(assessments);
      case ExamLevel.UACE:
        return this.gradingService.calculateUACEResults(assessments);
      default:
        throw new Error(`Unsupported exam level: ${examLevel}`);
    }
  }
}
