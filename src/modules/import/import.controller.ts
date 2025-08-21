import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Roles, RolesGuard, JwtAuthGuard } from '@marka/modules/auth';
import { Role } from '@marka/modules/users';
import { Tenant } from '@marka/common';
import { ImportJob } from './import-job.entity';

@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import students from CSV/Excel' })
  @ApiResponse({ status: 201, description: 'Import job created successfully' })
  async importStudents(
    @UploadedFile() file: Express.Multer.File,
    @Tenant() tenant,
    @Request() req,
  ): Promise<ImportJob> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return this.importService.createImportJob({
      tenantId: tenant.id,
      type: 'students',
      file,
      userId: req.user.id,
    }, tenant);
  }

  @Post('assessments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import assessments from CSV/Excel' })
  @ApiResponse({ status: 201, description: 'Import job created successfully' })
  async importAssessments(
    @UploadedFile() file: Express.Multer.File,
    @Tenant() tenant,
    @Request() req,
  ): Promise<ImportJob> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return this.importService.createImportJob({
      tenantId: tenant.id,
      type: 'assessments',
      file,
      userId: req.user.id,
    }, tenant);
  }

  @Get('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all import jobs' })
  @ApiResponse({ status: 200, description: 'Return all import jobs' })
  async getImportJobs(@Tenant() tenant): Promise<ImportJob[]> {
    return this.importService.getImportJobs(tenant.id);
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an import job by ID' })
  @ApiResponse({ status: 200, description: 'Return the import job' })
  async getImportJob(
    @Param('id') id: string,
    @Tenant() tenant,
  ): Promise<ImportJob> {
    return this.importService.getImportJob(id, tenant.id);
  }
}