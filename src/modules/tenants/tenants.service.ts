import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { IsolationMode } from './tenant.entity';
import * as crypto from 'crypto';
import { TenantPlan } from '@marka/common';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Generate API key
    const apiKey = crypto.randomBytes(16).toString('hex');

    // Determine isolation mode based on plan
    const isolationMode =
      createTenantDto.plan === TenantPlan.ENTERPRISE
        ? IsolationMode.SCHEMA
        : IsolationMode.RLS;

    // Create tenant
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      apiKey,
      isolationMode,
    });

    // If schema isolation, create the schema
    if (isolationMode === IsolationMode.SCHEMA) {
      const schemaName = `tenant_${crypto.randomBytes(8).toString('hex')}`;
      tenant.schemaName = schemaName;
      await this.createTenantSchema(schemaName);
    }

    return this.tenantRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findByIdentifier(identifier: string): Promise<Tenant> {
    // Validate UUID format first
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(identifier)) {
      throw new NotFoundException(
        `Invalid tenant identifier format: ${identifier}`,
      );
    }

    // Try to find by subdomain or API key
    const tenant = await this.tenantRepository.findOne({
      where: [
        { subdomain: identifier },
        { apiKey: identifier },
        { id: identifier },
      ],
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with identifier ${identifier} not found`,
      );
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);

    // If schema isolation, drop the schema
    if (tenant.isolationMode === IsolationMode.SCHEMA && tenant.schemaName) {
      await this.dropTenantSchema(tenant.schemaName);
    }

    await this.tenantRepository.remove(tenant);
  }

  async setTenantContext(tenantId: string): Promise<void> {
    await this.dataSource.query(`SET app.tenant_id = '${tenantId}'`);
  }

  async setTenantSchema(schemaName: string): Promise<void> {
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
  }

  private async createTenantSchema(schemaName: string): Promise<void> {
    try {
      // Create the schema
      await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

      // Run migrations for the new schema
      // In a real implementation, you would run migrations here
      console.log(`Created schema: ${schemaName}`);
    } catch (error) {
      console.error(`Error creating schema ${schemaName}:`, error);
      throw error;
    }
  }

  private async dropTenantSchema(schemaName: string): Promise<void> {
    try {
      // Drop the schema
      await this.dataSource.query(
        `DROP SCHEMA IF EXISTS ${schemaName} CASCADE`,
      );
      console.log(`Dropped schema: ${schemaName}`);
    } catch (error) {
      console.error(`Error dropping schema ${schemaName}:`, error);
      throw error;
    }
  }
}
