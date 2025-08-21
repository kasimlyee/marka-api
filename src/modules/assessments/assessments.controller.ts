import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles, RolesGuard, JwtAuthGuard } from '@marka/modules/auth';
import { Role } from '../users/user.entity';
import { Tenant } from '@marka/common';
import { Assessment } from './assessment.entity';
import { ExamLevel } from './assessment.entity';

@ApiTags('assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new assessment' })
  @ApiResponse({ status: 201, description: 'Assessment successfully created' })
  async create(
    @Body() createAssessmentDto: CreateAssessmentDto,
    @Tenant() tenant,
  ): Promise<Assessment> {
    return this.assessmentsService.create(createAssessmentDto, tenant.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all assessments' })
  @ApiResponse({ status: 200, description: 'Return all assessments' })
  async findAll(
    @Tenant() tenant,
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('examLevel') examLevel?: string,
  ): Promise<Assessment[]> {
    return this.assessmentsService.findAll(
      tenant.id,
      studentId,
      subjectId,
      examLevel,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an assessment by ID' })
  @ApiResponse({ status: 200, description: 'Return the assessment' })
  async findOne(
    @Param('id') id: string,
    @Tenant() tenant,
  ): Promise<Assessment> {
    return this.assessmentsService.findOne(id, tenant.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an assessment' })
  @ApiResponse({ status: 200, description: 'Assessment successfully updated' })
  async update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @Tenant() tenant,
  ): Promise<Assessment> {
    return this.assessmentsService.update(id, updateAssessmentDto, tenant.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an assessment' })
  @ApiResponse({ status: 200, description: 'Assessment successfully deleted' })
  async remove(@Param('id') id: string, @Tenant() tenant): Promise<void> {
    return this.assessmentsService.remove(id, tenant.id);
  }

  @Get('student/:studentId/results/:examLevel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate student results for an exam level' })
  @ApiResponse({ status: 200, description: 'Return calculated results' })
  async calculateStudentResults(
    @Param('studentId') studentId: string,
    @Param('examLevel') examLevel: ExamLevel,
    @Tenant() tenant,
  ) {
    return this.assessmentsService.calculateStudentResults(
      studentId,
      tenant.id,
      examLevel,
    );
  }
}
