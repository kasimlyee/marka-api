import { Injectable } from '@nestjs/common';
import { Grade, ExamLevel, Assessment } from '@marka/modules/assessments';

export interface GradingResult {
  grade: string;
  points: number;
  division?: string;
  aggregate?: number;
  resultType?: string;
  totalPoints?: number;
}

@Injectable()
export class GradingService {
  // PLE Grading (Primary Leaving Examination)
  calculatePLEGrade(score: number): GradingResult {
    if (score >= 80) return { grade: Grade.D1, points: 1 };
    if (score >= 70) return { grade: Grade.D2, points: 2 };
    if (score >= 65) return { grade: Grade.C3, points: 3 };
    if (score >= 60) return { grade: Grade.C4, points: 4 };
    if (score >= 55) return { grade: Grade.C5, points: 5 };
    if (score >= 50) return { grade: Grade.C6, points: 6 };
    if (score >= 45) return { grade: Grade.P7, points: 7 };
    if (score >= 40) return { grade: Grade.P8, points: 8 };
    return { grade: Grade.F9, points: 9 };
  }

  // UCE Grading (Uganda Certificate of Education)
  calculateUCEGrade(score: number): GradingResult {
    if (score >= 80) return { grade: Grade.A, points: 1 };
    if (score >= 75) return { grade: Grade.B, points: 2 };
    if (score >= 60) return { grade: Grade.C, points: 3 };
    if (score >= 40) return { grade: Grade.D, points: 4 };
    if (score >= 30) return { grade: Grade.E, points: 5 };
    return { grade: Grade.F, points: 6 };
  }

  // UACE Grading (Uganda Advanced Certificate of Education)
  calculateUACEGrade(score: number): GradingResult {
    if (score >= 80) return { grade: Grade.A, points: 6 };
    if (score >= 70) return { grade: Grade.B, points: 5 };
    if (score >= 60) return { grade: Grade.C, points: 4 };
    if (score >= 50) return { grade: Grade.D, points: 3 };
    if (score >= 40) return { grade: Grade.E, points: 2 };
    if (score >= 35) return { grade: Grade.O, points: 1 };
    return { grade: Grade.F, points: 0 };
  }

  // Generic grade calculation based on exam level
  calculateGrade(score: number, examLevel: ExamLevel): GradingResult {
    switch (examLevel) {
      case ExamLevel.PLE:
        return this.calculatePLEGrade(score);
      case ExamLevel.UCE:
        return this.calculateUCEGrade(score);
      case ExamLevel.UACE:
        return this.calculateUACEGrade(score);
      default:
        throw new Error(`Unsupported exam level: ${examLevel}`);
    }
  }

  // Calculate PLE results (aggregates and divisions)
  calculatePLEResults(assessments: Assessment[]): {
    aggregate: number;
    division: string;
    subjectResults: Array<{
      subjectId: string;
      subjectName: string;
      score: number;
      grade: string;
      points: number;
    }>;
  } {
    // PLE has 4 subjects: English, Math, Science, Social Studies
    if (assessments.length !== 4) {
      throw new Error('PLE requires exactly 4 subjects');
    }

    const subjectResults = assessments.map((assessment) => ({
      subjectId: assessment.subjectId,
      subjectName: assessment.subject.name,
      score: assessment.totalScore,
      grade: assessment.grade,
      points: assessment.points,
    }));

    // Calculate aggregate (sum of points for all subjects)
    const aggregate = subjectResults.reduce(
      (sum, result) => sum + result.points,
      0,
    );

    // Determine division based on aggregate
    let division = '';
    if (aggregate >= 4 && aggregate <= 12) division = 'Division 1';
    else if (aggregate >= 13 && aggregate <= 23) division = 'Division 2';
    else if (aggregate >= 24 && aggregate <= 29) division = 'Division 3';
    else if (aggregate >= 30 && aggregate <= 34) division = 'Division 4';
    else division = 'Fail (U)';

    return {
      aggregate,
      division,
      subjectResults,
    };
  }

  // Calculate UCE results (A-E grades, Result 1/2)
  calculateUCEResults(assessments: Assessment[]): {
    resultType: string;
    subjectResults: Array<{
      subjectId: string;
      subjectName: string;
      score: number;
      grade: string;
      points: number;
    }>;
  } {
    // UCE has 8-10 subjects depending on the school
    if (assessments.length < 8) {
      throw new Error('UCE requires at least 8 subjects');
    }

    const subjectResults = assessments.map((assessment) => ({
      subjectId: assessment.subjectId,
      subjectName: assessment.subject.name,
      score: assessment.totalScore,
      grade: assessment.grade,
      points: assessment.points,
    }));

    // Check if student has at least one pass (Grade D or better)
    const hasPass = subjectResults.some((result) =>
      ['A', 'B', 'C', 'D'].includes(result.grade),
    );

    // Determine result type
    const resultType = hasPass ? 'Result 1' : 'Result 2';

    return {
      resultType,
      subjectResults,
    };
  }

  // Calculate UACE results (points for principal subjects, subsidiary passes)
  calculateUACEResults(assessments: Assessment[]): {
    totalPoints: number;
    principalSubjects: Array<{
      subjectId: string;
      subjectName: string;
      score: number;
      grade: string;
      points: number;
    }>;
    subsidiarySubjects: Array<{
      subjectId: string;
      subjectName: string;
      score: number;
      grade: string;
      points: number;
    }>;
  } {
    // Separate principal and subsidiary subjects
    const principalSubjects = assessments
      .filter(
        (assessment) =>
          !assessment.subject.code.includes('SUB') &&
          assessment.subject.code !== 'GP' &&
          assessment.subject.code !== 'ICT',
      )
      .map((assessment) => ({
        subjectId: assessment.subjectId,
        subjectName: assessment.subject.name,
        score: assessment.totalScore,
        grade: assessment.grade,
        points: assessment.points,
      }));

    const subsidiarySubjects = assessments
      .filter(
        (assessment) =>
          assessment.subject.code.includes('SUB') ||
          assessment.subject.code === 'GP' ||
          assessment.subject.code === 'ICT',
      )
      .map((assessment) => ({
        subjectId: assessment.subjectId,
        subjectName: assessment.subject.name,
        score: assessment.totalScore,
        grade: assessment.grade,
        points: assessment.points, // For subsidiary, pass = 1 point, fail = 0
      }));

    // Sort principal subjects by points (descending) and take top 3
    principalSubjects.sort((a, b) => b.points - a.points);
    const topPrincipalSubjects = principalSubjects.slice(0, 3);

    // Calculate total points (sum of top 3 principal subjects + subsidiary passes)
    const principalPoints = topPrincipalSubjects.reduce(
      (sum, subject) => sum + subject.points,
      0,
    );
    const subsidiaryPoints = subsidiarySubjects
      .filter((subject) => subject.points > 0)
      .reduce((sum, subject) => sum + 1, 0); // Each subsidiary pass is 1 point

    const totalPoints = principalPoints + subsidiaryPoints;

    return {
      totalPoints,
      principalSubjects: topPrincipalSubjects,
      subsidiarySubjects,
    };
  }
}
