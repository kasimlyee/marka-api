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
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant, Role } from '@marka/common';
import { School } from './school.entity';
import { TenantGuard } from '../tenants/guard/tenant.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipValidation } from '@marka/common/decorators/skip-validation.decorator';

@ApiTags('schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // Allow extra fields from multipart
    transform: true,
  }))
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new school with optional logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'School data with optional logo file',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        code: { type: 'string' },
        level: { type: 'string', enum: Object.values(SchoolLevel) },
        address: { type: 'string' },
        city: { type: 'string' },
        district: { type: 'string' },
        region: { type: 'string' },
        postalCode: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        website: { type: 'string', format: 'uri' },
        logo: { type: 'string', format: 'binary' },
      },
      required: ['name', 'level'],
    },
  })
  async create(
    @Body() createSchoolDto: CreateSchoolWithFileDto,
    @UploadedFile() logo: Express.Multer.File,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.schoolsService.create(createSchoolDto, tenantId, logo);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all schools' })
  @ApiResponse({ status: 200, description: 'Return all schools' })
  async findAll(@Tenant() tenant): Promise<School[]> {
    return this.schoolsService.findAll(tenant.id);
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo'))
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UsePipes()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload school logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'School logo image file',
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async uploadLogo(
    @Param('id') schoolId: string,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.schoolsService.uploadSchoolLogo(schoolId, logo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a school by ID' })
  @ApiResponse({ status: 200, description: 'Return the school' })
  async findOne(@Param('id') id: string, @Tenant() tenant): Promise<School> {
    return this.schoolsService.findOne(id, tenant.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a school' })
  @ApiResponse({ status: 200, description: 'School successfully deleted' })
  async remove(@Param('id') id: string, @Tenant() tenant): Promise<void> {
    return this.schoolsService.remove(id, tenant.id);
  }
}
