import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../students/student.entity';
import { Assessment } from '../../assessments/assessment.entity';
import { Subject } from '../../subjects/subject.entity';
import { School } from '../../schools/school.entity';
import { ExamLevel } from '../entities/report-card-template.entity';

export interface ReportCardData {
  student: Student;
  school: School;
  assessments: Assessment[];
  subjects: Subject[];
  academicYear: string;
  term: string;
  examLevel: ExamLevel;
  statistics: {
    totalSubjects: number;
    averageScore: number;
    totalMarks: number;
    position?: number;
    grade?: string;
  };
  customData?: Record<string, any>;
}

@Injectable()
export class ReportCardDataService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private readonly logger = new Logger(ReportCardDataService.name),
  ) {}

  async prepareReportCardData(
    studentId: string,
    examLevel: ExamLevel,
    academicYear: string,
    term: string,
  ): Promise<ReportCardData> {
    // Fetch student with relations
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });

    if (!student) {
      this.logger.error(`Student not found: ${studentId}`);
      throw new Error('Student not found');
    }

    // Fetch school
    const school = await this.schoolRepository.findOne({
      where: { id: student.schoolId },
    });

    if (!school) {
      this.logger.error(`School not found: ${student.schoolId}`);
      throw new Error('School not found');
    }

    // Fetch assessments for the student in the given academic year and term
    const assessments = await this.assessmentRepository.find({
      where: {
        studentId,
        examLevel,
        // Add academic year and term filters if these fields exist in Assessment entity
      },
      relations: ['subject'],
      order: { createdAt: 'DESC' },
    });

    // Fetch subjects for the exam level
    const subjects = await this.subjectRepository.find({
      where: { examLevel },
    });

    // Calculate statistics
    const statistics = this.calculateStatistics(assessments);

    return {
      student,
      school,
      assessments,
      subjects,
      academicYear,
      term,
      examLevel,
      statistics,
    };
  }

  private calculateStatistics(assessments: Assessment[]) {
    const totalSubjects = assessments.length;
    let totalMarks = 0;
    let validScores = 0;

    for (const assessment of assessments) {
      const finalScore =
        (assessment.caScore || 0) + (assessment.examScore || 0);
      if (finalScore > 0) {
        totalMarks += finalScore;
        validScores++;
      }
    }

    const averageScore = validScores > 0 ? totalMarks / validScores : 0;

    return {
      totalSubjects,
      averageScore: Number(averageScore.toFixed(2)),
      totalMarks: Number(totalMarks.toFixed(2)),
    };
  }
}
