import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  Query,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Tenant, Role } from '@marka/common';
import { Student } from './student.entity';
import { TenantGuard } from '../tenants/guard/tenant.guard';
import { SchoolsService } from '../schools/schools.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipValidation } from '@marka/common/decorators/skip-validation.decorator';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly schoolsService: SchoolsService,
  ) {}

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

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @SkipValidation()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload student photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Student photo image file',
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async uploadPhoto(
    @Param('id') studentId: string,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    return this.studentsService.uploadStudentPhoto(studentId, photo);
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
