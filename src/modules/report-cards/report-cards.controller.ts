import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  StreamableFile,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportCardService } from './report-cards.service';
import {
  GenerateReportCardDto,
  BulkGenerateReportCardDto,
} from './dto/generate-report-card.dto';
import { ReportCardStatus } from './entities/report-card.entity';
import { ExamLevel } from './entities/report-card-template.entity';
import { TenantGuard } from '../tenants/guard/tenant.guard';
import { Role } from '@marka/common/index';

@Controller('report-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportCardController {
  constructor(private readonly reportCardService: ReportCardService) {}

  @Post('generate')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @Body() generateDto: GenerateReportCardDto,
    @Req() req: Request,
  ) {
    const { user } = req as any;
    return {
      success: true,
      message: 'Report card generation started',
      data: await this.reportCardService.generateReportCard(
        generateDto,
        user.id,
      ),
    };
  }

  @Post('generate/bulk')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async bulkGenerate(
    @Body() bulkGenerateDto: BulkGenerateReportCardDto,
    @Req() req: Request,
  ) {
    const { user } = req as any;
    return {
      success: true,
      message: 'Bulk report card generation started',
      data: await this.reportCardService.bulkGenerateReportCards(
        bulkGenerateDto,
        user.id,
      ),
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER, Role.PARENT)
  async findAll(
    @Req() req: Request,
    @Query('studentId') studentId?: string,
    @Query('examLevel') examLevel?: ExamLevel,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
    @Query('status') status?: ReportCardStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const { user } = req as any;

    const filters: any = {};

    // Role-based filtering
    if (user.role === 'parent') {
      // Parents can only see their children's report cards
      // You'll need to implement parent-student relationship logic
      filters.parentId = user.id;
    } else {
      filters.schoolId = user.schoolId;
    }

    if (studentId) filters.studentId = studentId;
    if (examLevel) filters.examLevel = examLevel;
    if (academicYear) filters.academicYear = academicYear;
    if (term) filters.term = term;
    if (status) filters.status = status;

    const result = await this.reportCardService.getReportCards(
      filters,
      page,
      limit,
    );

    return {
      success: true,
      message: 'Report cards retrieved successfully',
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id/download')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.PARENT)
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { filePath, fileName } =
      await this.reportCardService.downloadReportCard(id);

    const file = createReadStream(filePath);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(file);
  }

  @Get('statistics')
  @UseGuards(RolesGuard, TenantGuard)
  @Roles(Role.ADMIN)
  async getStatistics(
    @Req() req: Request,
    @Query('examLevel') examLevel?: ExamLevel,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
  ) {
    const { user } = req as any;

    // Implementation would include statistics like:
    // - Total report cards generated
    // - Success/failure rates
    // - Most used templates
    // - Generation trends

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalReports: 0,
        completedReports: 0,
        failedReports: 0,
        pendingReports: 0,
        // Add more statistics as needed
      },
    };
  }
}
