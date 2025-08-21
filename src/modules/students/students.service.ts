import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import * as crypto from 'crypto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto, tenantId: string): Promise<Student> {
    // Generate LIN if not provided
    if (!createStudentDto.lin) {
      createStudentDto.lin = this.generateLIN();
    }

    // Check if LIN already exists
    const existingStudent = await this.studentRepository.findOne({
      where: { lin: createStudentDto.lin },
    });
    if (existingStudent) {
      // If LIN exists, generate a new one
      createStudentDto.lin = this.generateLIN();
    }

    const student = this.studentRepository.create({
      ...createStudentDto,
      tenantId,
    });
    return this.studentRepository.save(student);
  }

  async findAll(tenantId: string, schoolId?: string): Promise<Student[]> {
    const where: any = { tenantId };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return this.studentRepository.find({ where });
  }

  async findOne(id: string, tenantId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id, tenantId },
      relations: ['school'],
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async findByLIN(lin: string, tenantId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { lin, tenantId },
      relations: ['school'],
    });
    if (!student) {
      throw new NotFoundException(`Student with LIN ${lin} not found`);
    }
    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
    tenantId: string,
  ): Promise<Student> {
    const student = await this.findOne(id, tenantId);
    Object.assign(student, updateStudentDto);
    return this.studentRepository.save(student);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const student = await this.findOne(id, tenantId);
    await this.studentRepository.remove(student);
  }

  private generateLIN(): string {
    // Generate a unique Learner Identification Number
    // Format: UG + year + random 8 digits
    const year = new Date().getFullYear().toString().slice(-2);
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `UG${year}${random}`;
  }
}