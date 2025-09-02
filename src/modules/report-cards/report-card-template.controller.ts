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
  Req,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportCardTemplateService } from './report-card-template.service';
import { CreateReportCardTemplateDto } from './dto/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dto/update-report-card-template.dto';
import {
  ExamLevel,
  TemplateStatus,
} from './entities/report-card-template.entity';
import { Role } from '../../common/enums/role.enum';
import { TenantGuard } from '../tenants/guard/tenant.guard';

@Controller('report-card-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportCardTemplateController {
  constructor(private readonly templateService: ReportCardTemplateService) {}

  @Post()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateReportCardTemplateDto,
    @Req() req: Request,
  ) {
    const { user } = req as any;
    return {
      success: true,
      message: 'Template created successfully',
      data: await this.templateService.create(
        createDto,
        user.schoolId,
        user.id,
      ),
    };
  }

  @Get()
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async findAll(
    @Req() req: Request,
    @Query('examLevel') examLevel?: ExamLevel,
    @Query('status') status?: TemplateStatus,
    @Query('isDefault') isDefault?: boolean,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const { user } = req as any;
    const result = await this.templateService.findAll(
      user.schoolId,
      { examLevel, status, isDefault },
      page,
      limit,
    );

    return {
      success: true,
      message: 'Templates retrieved successfully',
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const { user } = req as any;
    return {
      success: true,
      message: 'Template retrieved successfully',
      data: await this.templateService.findOne(id, user.schoolId),
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateReportCardTemplateDto,
    @Req() req: Request,
  ) {
    const { user } = req as any;
    return {
      success: true,
      message: 'Template updated successfully',
      data: await this.templateService.update(
        id,
        updateDto,
        user.schoolId,
        user.id,
      ),
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const { user } = req as any;
    await this.templateService.remove(id, user.schoolId);
    return {
      success: true,
      message: 'Template deleted successfully',
    };
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async activate(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const { user } = req as any;
    return {
      success: true,
      message: 'Template activated successfully',
      data: await this.templateService.activate(id, user.schoolId),
    };
  }

  @Patch(':id/archive')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async archive(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const { user } = req as any;
    return {
      success: true,
      message: 'Template archived successfully',
      data: await this.templateService.archive(id, user.schoolId),
    };
  }

  @Post(':id/clone')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async clone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') newName: string,
    @Req() req: Request,
  ) {
    const { user } = req as any;
    return {
      success: true,
      message: 'Template cloned successfully',
      data: await this.templateService.clone(
        id,
        user.schoolId,
        user.id,
        newName,
      ),
    };
  }

  @Get('default/:examLevel')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async getDefault(
    @Param('examLevel') examLevel: ExamLevel,
    @Req() req: Request,
  ) {
    const { user } = req as any;
    const template = await this.templateService.getDefaultTemplate(
      user.schoolId,
      examLevel,
    );

    return {
      success: true,
      message: 'Default template retrieved successfully',
      data: template,
    };
  }
}
