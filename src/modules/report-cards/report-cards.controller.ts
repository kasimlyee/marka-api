import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Response,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role as UserRole } from '../../common/enums/role.enum';
import { ReportCardService } from './report-cards.service';
import { CreateReportCardDto } from './dto/create-report-card.dto';
import { UpdateReportCardDto } from './dto/update-report-card.dto';
import { GenerateReportCardDto } from './dto/generate-report-card.dto';
import { CreateTemplateDto } from './dto/create-report-card-template.dto';
import { UpdateTemplateDto } from './dto/update-report-card-template.dto';
import { ReportCard, ReportCardStatus } from './entities/report-card.entity';
import { ReportCardTemplate } from './entities/report-card-template.entity';
import { ExamLevel } from '../assessments/assessment.entity';
import * as fs from 'fs';
import type { Response as ExpressResponse } from 'express';
import * as path from 'path';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { TenantGuard } from '../tenants/guard/tenant.guard';

@ApiTags('Report Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('report-cards')
export class ReportCardController {
  constructor(private readonly reportCardService: ReportCardService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new report card' })
  @ApiResponse({ status: 201, description: 'Report card successfully created' })
  async create(
    @Body() createDto: CreateReportCardDto,
    @Tenant() tenant,
  ): Promise<ReportCard> {
    return this.reportCardService.create(createDto, tenant.id);
  }

  @Post('generate/bulk')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Generate report cards in bulk' })
  @ApiResponse({ status: 201, description: 'Bulk generation initiated' })
  async generateBulk(
    @Body() generateDto: GenerateReportCardDto,
    @Tenant() tenant,
  ): Promise<{ jobIds: string[] }> {
    return this.reportCardService.generateBulk(generateDto, tenant.id);
  }

  @Post(':id/generate')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Generate PDF for a report card' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  async generatePdf(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportCard> {
    return this.reportCardService.generatePdf(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get all report cards' })
  @ApiResponse({ status: 200, description: 'Return all report cards' })
  @ApiQuery({ name: 'status', required: false, enum: ReportCardStatus })
  @ApiQuery({ name: 'examLevel', required: false, enum: ExamLevel })
  @ApiQuery({ name: 'term', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  async findAll(
    @Query() query: any,
    @Request() req: any,
  ): Promise<ReportCard[]> {
    const filters = {
      status: query.status,
      examLevel: query.examLevel,
      term: query.term ? parseInt(query.term) : undefined,
      year: query.year ? parseInt(query.year) : undefined,
      studentId: query.studentId,
    };

    return this.reportCardService.findAll(req.user.schoolId, filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Get a report card by ID' })
  @ApiResponse({ status: 200, description: 'Return the report card' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ReportCard> {
    return this.reportCardService.findOne(id, req.user.schoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a report card' })
  @ApiResponse({ status: 200, description: 'Report card successfully updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateReportCardDto,
    @Tenant() tenant,
  ): Promise<ReportCard> {
    return this.reportCardService.update(id, updateDto, tenant.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete a report card' })
  @ApiResponse({ status: 200, description: 'Report card successfully deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.reportCardService.remove(id, req.user.schoolId);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  @ApiOperation({ summary: 'Download report card PDF' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const pdfPath = await this.reportCardService.downloadPdf(
      id,
      req.user.schoolId,
    );

    const file = fs.createReadStream(pdfPath);
    const filename = path.basename(pdfPath);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  // Template management endpoints
  @Post('templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a report card template' })
  @ApiResponse({ status: 201, description: 'Template successfully created' })
  async createTemplate(
    @Body() createDto: CreateTemplateDto,
    @Tenant() tenant,
  ): Promise<ReportCardTemplate> {
    return this.reportCardService.createTemplate(createDto, tenant.id);
  }

  @Get('templates')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all templates' })
  @ApiResponse({ status: 200, description: 'Return all templates' })
  @ApiQuery({ name: 'examLevel', required: false, enum: ExamLevel })
  async findTemplates(
    @Tenant() tenant,
    @Query('examLevel') examLevel?: ExamLevel,
  ): Promise<ReportCardTemplate[]> {
    return this.reportCardService.findTemplates(tenant.id, examLevel);
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({ status: 200, description: 'Template successfully updated' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTemplateDto,
  ): Promise<ReportCardTemplate> {
    return this.reportCardService.updateTemplate(id, updateDto);
  }

  @Delete('templates/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a template' })
  @ApiResponse({ status: 204, description: 'Template successfully deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.reportCardService.deleteTemplate(id);
  }
}
