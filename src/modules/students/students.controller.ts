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
  NotFoundException
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Tenant, Role } from '@marka/common';
import { Student } from './student.entity';
import { TenantGuard } from '../tenants/guard/tenant.guard';
import { SchoolsService } from '../schools/schools.service';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService, private readonly schoolsService: SchoolsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: 201, description: 'Student successfully created' })
  async create(
    @Body() createStudentDto: CreateStudentDto,
    @Tenant() tenant,
  ): Promise<Student> {
    // Get the school for this tenant
    const school = await this.schoolsService.findByTenantId(tenant.id);

    if (!school) {
      throw new NotFoundException('School not found for this tenant');
    }
    createStudentDto.schoolId = school.id;
    return this.studentsService.create(createStudentDto, tenant.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all students' })
  @ApiResponse({ status: 200, description: 'Return all students' })
  async findAll(
    @Tenant() tenant,
    @Query('schoolId') schoolId?: string,
  ): Promise<Student[]> {
    return this.studentsService.findAll(tenant.id, schoolId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiResponse({ status: 200, description: 'Return the student' })
  async findOne(@Param('id') id: string, @Tenant() tenant): Promise<Student> {
    return this.studentsService.findOne(id, tenant.id);
  }

  @Get('lin/:lin')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.PARENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a student by LIN' })
  @ApiResponse({ status: 200, description: 'Return the student' })
  async findByLIN(
    @Param('lin') lin: string,
    @Tenant() tenant,
  ): Promise<Student> {
    return this.studentsService.findByLIN(lin, tenant.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a student' })
  @ApiResponse({ status: 200, description: 'Student successfully updated' })
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Tenant() tenant,
  ): Promise<Student> {
    return this.studentsService.update(id, updateStudentDto, tenant.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a student' })
  @ApiResponse({ status: 200, description: 'Student successfully deleted' })
  async remove(@Param('id') id: string, @Tenant() tenant): Promise<void> {
    return this.studentsService.remove(id, tenant.id);
  }
}
