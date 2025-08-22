import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RolesGuard, Roles, JwtAuthGuard } from '@marka/modules/auth';
import { Role } from '@marka/modules/users';
import { Tenant } from '@marka/common';
import { AuditLog } from './audit-log.entity';
import { ActionType } from './audit-log.entity';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all audit logs' })
  @ApiResponse({ status: 200, description: 'Return all audit logs' })
  async findAll(
    @Tenant() tenant,
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: ActionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AuditLog[]> {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.auditService.findAll(tenant.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an audit log by ID' })
  @ApiResponse({ status: 200, description: 'Return the audit log' })
  async findOne(@Param('id') id: string, @Tenant() tenant): Promise<AuditLog> {
    return this.auditService.findOne(id, tenant.id);
  }

  @Post('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export audit logs' })
  @ApiResponse({ status: 200, description: 'Return exported audit logs' })
  async exportAuditLogs(
    @Tenant() tenant,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: ActionType,
  ): Promise<AuditLog[]> {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.auditService.exportAuditLogs(
      tenant.id,
      startDateObj,
      endDateObj,
      userId,
      entity,
      action,
    );
  }
}
