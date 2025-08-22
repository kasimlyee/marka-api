import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { ActionType } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createAuditLogDto);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(tenantId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenantId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id, tenantId },
      relations: ['user'],
    });
    if (!auditLog) {
      throw new Error(`Audit log with ID ${id} not found`);
    }
    return auditLog;
  }

  async logAction(
    action: ActionType,
    entity: string,
    entityId: string,
    tenantId: string,
    userId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.create({
      action,
      entity,
      entityId,
      tenantId,
      userId,
      oldValues,
      newValues,
      metadata,
      userAgent,
      ipAddress,
    });
  }

  async logLogin(
    tenantId: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.logAction(
      ActionType.LOGIN,
      'User',
      userId,
      tenantId,
      userId,
      undefined,
      undefined,
      undefined,
      userAgent,
      ipAddress,
    );
  }

  async logLogout(
    tenantId: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.logAction(
      ActionType.LOGOUT,
      'User',
      userId,
      tenantId,
      userId,
      undefined,
      undefined,
      undefined,
      userAgent,
      ipAddress,
    );
  }

  async logCreate(
    entity: string,
    entityId: string,
    tenantId: string,
    userId: string,
    newValues: Record<string, any>,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.logAction(
      ActionType.CREATE,
      entity,
      entityId,
      tenantId,
      userId,
      undefined,
      newValues,
      undefined,
      userAgent,
      ipAddress,
    );
  }

  async logUpdate(
    entity: string,
    entityId: string,
    tenantId: string,
    userId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.logAction(
      ActionType.UPDATE,
      entity,
      entityId,
      tenantId,
      userId,
      oldValues,
      newValues,
      undefined,
      userAgent,
      ipAddress,
    );
  }

  async logDelete(
    entity: string,
    entityId: string,
    tenantId: string,
    userId: string,
    oldValues: Record<string, any>,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.logAction(
      ActionType.DELETE,
      entity,
      entityId,
      tenantId,
      userId,
      oldValues,
      undefined,
      undefined,
      userAgent,
      ipAddress,
    );
  }

  async logRead(
    entity: string,
    entityId: string,
    tenantId: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.logAction(
      ActionType.READ,
      entity,
      entityId,
      tenantId,
      userId,
      undefined,
      undefined,
      undefined,
      userAgent,
      ipAddress,
    );
  }

  async exportAuditLogs(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    userId?: string,
    entity?: string,
    action?: ActionType,
  ): Promise<AuditLog[]> {
    const where: any = { tenantId };

    if (startDate) {
      where.createdAt = { $gte: startDate };
    }

    if (endDate) {
      if (!where.createdAt) where.createdAt = {};
      where.createdAt.$lte = endDate;
    }

    if (userId) {
      where.userId = userId;
    }

    if (entity) {
      where.entity = entity;
    }

    if (action) {
      where.action = action;
    }

    return this.auditLogRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}