import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { StoreService } from '../store/store.service';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    private readonly storeService: StoreService,
  ) {}

  async create(
    createSchoolDto: CreateSchoolDto,
    tenantId: string,
    logoFile?: Express.Multer.File,
  ): Promise<School> {
    // Check if a school already exists for the tenant
    const existingSchool = await this.schoolRepository.findOne({
      where: { tenantId },
    });
    if (existingSchool) {
      throw new ConflictException(
        `School already exists for tenant ${tenantId}, Only one school allowed per tenant`,
      );
    }

    let logoUrl: string | undefined;

    // Upload logo if provided
    if (logoFile) {
      const result = await this.storeService.uploadFile(logoFile, {
        folder: 'school-logos',
        fileName: `school-${Date.now()}`, // Use timestamp since we don't have school ID yet
        contentType: 'image/jpeg',
        transformations: [
          { width: 300, height: 300, crop: 'fill' },
          { quality: 'auto:good' },
        ],
      });
      logoUrl = result.url;
    }

    // Create school with logo URL if uploaded
    const school = this.schoolRepository.create({
      ...createSchoolDto,
      tenantId,
      logoUrl: logoUrl || createSchoolDto.logoUrl, // Use uploaded URL or provided URL
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
    logoFile?: Express.Multer.File,
  ): Promise<School> {
    const school = await this.findOne(id, tenantId);

    let logoUrl: string | undefined;

    // Upload new logo if provided
    if (logoFile) {
      const result = await this.storeService.uploadFile(logoFile, {
        folder: 'school-logos',
        fileName: `school-${id}`,
        contentType: 'image/jpeg',
        transformations: [
          { width: 300, height: 300, crop: 'fill' },
          { quality: 'auto:good' },
        ],
      });
      logoUrl = result.url;
    }

    // Update school data
    Object.assign(school, {
      ...updateSchoolDto,
      ...(logoUrl && { logoUrl }), // Only update logoUrl if new file was uploaded
    });

    return this.schoolRepository.save(school);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const school = await this.findOne(id, tenantId);
    await this.schoolRepository.remove(school);
  }

  async findByTenantId(tenantId: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { tenantId },
    });
    if (!school) {
      throw new NotFoundException(`School for tenant ${tenantId} not found`);
    }
    return school;
  }

  async uploadSchoolLogo(schoolId: string, file: Express.Multer.File) {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    // Upload to cloudinary
    const result = await this.storeService.uploadFile(file, {
      folder: 'school-logos',
      fileName: `school-${schoolId}`,
      contentType: 'image/jpeg',
      transformations: [
        { width: 300, height: 300, crop: 'fill' },
        { quality: 'auto:good' },
      ],
    });

    // Store the url in the school database
    school.logoUrl = result.url;
    await this.schoolRepository.save(school);
    return { url: result.url };
  }
}
