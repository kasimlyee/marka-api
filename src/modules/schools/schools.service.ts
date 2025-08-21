import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async create(createSchoolDto: CreateSchoolDto, tenantId: string): Promise<School> {
    const school = this.schoolRepository.create({
      ...createSchoolDto,
      tenantId,
    });
    return this.schoolRepository.save(school);
  }

  async findAll(tenantId: string): Promise<School[]> {
    return this.schoolRepository.find({ where: { tenantId } });
  }

  async findOne(id: string, tenantId: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id, tenantId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    return school;
  }

  async update(
    id: string,
    updateSchoolDto: UpdateSchoolDto,
    tenantId: string,
  ): Promise<School> {
    const school = await this.findOne(id, tenantId);
    Object.assign(school, updateSchoolDto);
    return this.schoolRepository.save(school);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const school = await this.findOne(id, tenantId);
    await this.schoolRepository.remove(school);
  }
}