import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles, JwtAuthGuard, RolesGuard } from '@marka/modules/auth';
import { Tenant, Role } from '@marka/common';
import { Report } from './report.entity';
import { ReportTemplate } from './report-template.entity';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report successfully created' })
  async create(
    @Body() createReportDto: CreateReportDto,
    @Tenant() tenant,
  ): Promise<Report> {
    return this.reportsService.create(createReportDto, tenant.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({ status: 200, description: 'Return all reports' })
  async findAll(
    @Tenant() tenant,
    @Query('studentId') studentId?: string,
    @Query('examLevel') examLevel?: string,
  ): Promise<Report[]> {
    return this.reportsService.findAll(tenant.id, studentId, examLevel);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiResponse({ status: 200, description: 'Return the report' })
  async findOne(@Param('id') id: string, @Tenant() tenant): Promise<Report> {
    return this.reportsService.findOne(id, tenant.id);
  }

  @Get('no/:reportNo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a report by report number' })
  @ApiResponse({ status: 200, description: 'Return the report' })
  async findByReportNo(
    @Param('reportNo') reportNo: string,
    @Tenant() tenant,
  ): Promise<Report> {
    return this.reportsService.findByReportNo(reportNo, tenant.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a report' })
  @ApiResponse({ status: 200, description: 'Report successfully updated' })
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Tenant() tenant,
  ): Promise<Report> {
    return this.reportsService.update(id, updateReportDto, tenant.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a report' })
  @ApiResponse({ status: 200, description: 'Report successfully deleted' })
  async remove(@Param('id') id: string, @Tenant() tenant): Promise<void> {
    return this.reportsService.remove(id, tenant.id);
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available report templates' })
  @ApiResponse({ status: 200, description: 'Return available templates' })
  async getTemplates(@Tenant() tenant): Promise<ReportTemplate[]> {
    return this.reportsService.getTemplates(tenant.id);
  }
}
