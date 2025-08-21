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
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles, RolesGuard, JwtAuthGuard } from '@marka/modules/auth';
import { Role } from '../users/user.entity';
import { Tenant } from '@marka/common';
import { School } from './school.entity';

@ApiTags('schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new school' })
  @ApiResponse({ status: 201, description: 'School successfully created' })
  async create(
    @Body() createSchoolDto: CreateSchoolDto,
    @Tenant() tenant,
  ): Promise<School> {
    return this.schoolsService.create(createSchoolDto, tenant.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all schools' })
  @ApiResponse({ status: 200, description: 'Return all schools' })
  async findAll(@Tenant() tenant): Promise<School[]> {
    return this.schoolsService.findAll(tenant.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a school by ID' })
  @ApiResponse({ status: 200, description: 'Return the school' })
  async findOne(@Param('id') id: string, @Tenant() tenant): Promise<School> {
    return this.schoolsService.findOne(id, tenant.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a school' })
  @ApiResponse({ status: 200, description: 'School successfully updated' })
  async update(
    @Param('id') id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
    @Tenant() tenant,
  ): Promise<School> {
    return this.schoolsService.update(id, updateSchoolDto, tenant.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a school' })
  @ApiResponse({ status: 200, description: 'School successfully deleted' })
  async remove(@Param('id') id: string, @Tenant() tenant): Promise<void> {
    return this.schoolsService.remove(id, tenant.id);
  }
}
