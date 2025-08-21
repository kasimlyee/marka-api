import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(
    createSubjectDto: CreateSubjectDto,
    tenantId: string,
  ): Promise<Subject> {
    const subject = this.subjectRepository.create({
      ...createSubjectDto,
      tenantId,
    });
    return this.subjectRepository.save(subject);
  }

  async findAll(tenantId: string, examLevel?: string): Promise<Subject[]> {
    const where: any = { tenantId };
    if (examLevel) {
      where.examLevel = examLevel;
    }
    return this.subjectRepository.find({ where });
  }

  async findOne(id: string, tenantId: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: { id, tenantId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async findByCode(code: string, tenantId: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: { code, tenantId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with code ${code} not found`);
    }
    return subject;
  }

  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
    tenantId: string,
  ): Promise<Subject> {
    const subject = await this.findOne(id, tenantId);
    Object.assign(subject, updateSubjectDto);
    return this.subjectRepository.save(subject);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const subject = await this.findOne(id, tenantId);
    await this.subjectRepository.remove(subject);
  }

  async seedDefaultSubjects(tenantId: string): Promise<void> {
    // PLE Subjects
    const pleSubjects = [
      {
        name: 'English Language',
        code: 'ENG',
        examLevel: 'ple',
        isCompulsory: true,
      },
      {
        name: 'Mathematics',
        code: 'MATH',
        examLevel: 'ple',
        isCompulsory: true,
      },
      { name: 'Science', code: 'SCI', examLevel: 'ple', isCompulsory: true },
      {
        name: 'Social Studies',
        code: 'SST',
        examLevel: 'ple',
        isCompulsory: true,
      },
    ];

    // UCE Subjects
    const uceSubjects = [
      {
        name: 'English Language',
        code: 'ENG',
        examLevel: 'uce',
        isCompulsory: true,
      },
      {
        name: 'Mathematics',
        code: 'MATH',
        examLevel: 'uce',
        isCompulsory: true,
      },
      { name: 'Biology', code: 'BIO', examLevel: 'uce', isCompulsory: false },
      {
        name: 'Chemistry',
        code: 'CHEM',
        examLevel: 'uce',
        isCompulsory: false,
      },
      { name: 'Physics', code: 'PHY', examLevel: 'uce', isCompulsory: false },
      { name: 'History', code: 'HIST', examLevel: 'uce', isCompulsory: false },
      { name: 'Geography', code: 'GEO', examLevel: 'uce', isCompulsory: false },
      {
        name: 'Christian Religious Education',
        code: 'CRE',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'Islamic Religious Education',
        code: 'IRE',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'Entrepreneurship Education',
        code: 'ENT',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'Literature in English',
        code: 'LIT',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'Agriculture',
        code: 'AGR',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'Art and Design',
        code: 'ART',
        examLevel: 'uce',
        isCompulsory: false,
      },
      { name: 'Music', code: 'MUS', examLevel: 'uce', isCompulsory: false },
      { name: 'Commerce', code: 'COMM', examLevel: 'uce', isCompulsory: false },
      {
        name: 'Accounting',
        code: 'ACC',
        examLevel: 'uce',
        isCompulsory: false,
      },
      { name: 'Economics', code: 'ECO', examLevel: 'uce', isCompulsory: false },
      { name: 'Fine Art', code: 'FA', examLevel: 'uce', isCompulsory: false },
      {
        name: 'Technical Drawing',
        code: 'TD',
        examLevel: 'uce',
        isCompulsory: false,
      },
      { name: 'Woodwork', code: 'WW', examLevel: 'uce', isCompulsory: false },
      { name: 'Metalwork', code: 'MW', examLevel: 'uce', isCompulsory: false },
      {
        name: 'Food and Nutrition',
        code: 'FN',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'Textiles and Garmment Construction',
        code: 'TGC',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'Additional Mathematics',
        code: 'AMATH',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'Subsidiary Mathematics',
        code: 'SUBMATH',
        examLevel: 'uce',
        isCompulsory: false,
      },
      {
        name: 'General Paper',
        code: 'GP',
        examLevel: 'uce',
        isCompulsory: true,
      },
      { name: 'Kiswahili', code: 'KIS', examLevel: 'uce', isCompulsory: false },
      { name: 'German', code: 'GER', examLevel: 'uce', isCompulsory: false },
      { name: 'French', code: 'FRE', examLevel: 'uce', isCompulsory: false },
      { name: 'Latin', code: 'LAT', examLevel: 'uce', isCompulsory: false },
      { name: 'Arabic', code: 'ARA', examLevel: 'uce', isCompulsory: false },
      { name: 'Luganda', code: 'LUG', examLevel: 'uce', isCompulsory: false },
    ];

    // UACE Subjects
    const uaceSubjects = [
      {
        name: 'General Paper',
        code: 'GP',
        examLevel: 'uace',
        isCompulsory: true,
      },

      {
        name: 'Mathematics',
        code: 'MATH',
        examLevel: 'uace',
        isCompulsory: false,
      },
      { name: 'Biology', code: 'BIO', examLevel: 'uace', isCompulsory: false },
      {
        name: 'Chemistry',
        code: 'CHEM',
        examLevel: 'uace',
        isCompulsory: false,
      },
      { name: 'Physics', code: 'PHY', examLevel: 'uace', isCompulsory: false },
      { name: 'History', code: 'HIST', examLevel: 'uace', isCompulsory: false },
      {
        name: 'Geography',
        code: 'GEO',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Economics',
        code: 'ECO',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Entrepreneurship',
        code: 'ENT',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Literature in English',
        code: 'LIT',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Christian Religious Education',
        code: 'CRE',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Islamic Religious Education',
        code: 'IRE',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Agriculture',
        code: 'AGR',
        examLevel: 'uace',
        isCompulsory: false,
      },
      { name: 'Art', code: 'ART', examLevel: 'uace', isCompulsory: false },
      {
        name: 'Subsidiary ICT',
        code: 'ICT',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Subsidiary Mathematics',
        code: 'SUBMATH',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Kiswahili',
        code: 'KIS',
        examLevel: 'uace',
        isCompulsory: false,
      },
      { name: 'German', code: 'GER', examLevel: 'uace', isCompulsory: false },
      { name: 'French', code: 'FRE', examLevel: 'uace', isCompulsory: false },
      { name: 'Arabic', code: 'ARA', examLevel: 'uace', isCompulsory: false },
      { name: 'Luganda', code: 'LUG', examLevel: 'uace', isCompulsory: false },
      { name: 'Music', code: 'MUS', examLevel: 'uace', isCompulsory: false },
      {
        name: 'Food and Nutrition',
        code: 'FN',
        examLevel: 'uace',
        isCompulsory: false,
      },
      {
        name: 'Textiles and Garmment Construction',
        code: 'TGC',
        examLevel: 'uace',
        isCompulsory: false,
      },
    ];

    // Combine all subjects
    const allSubjects = [...pleSubjects, ...uceSubjects, ...uaceSubjects];

    // Create subjects
    for (const subjectData of allSubjects) {
      const subject = this.subjectRepository.create({
        ...subjectData,
        tenantId,
      });
      await this.subjectRepository.save(subject);
    }
  }
}
