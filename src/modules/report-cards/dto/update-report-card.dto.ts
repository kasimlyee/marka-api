import { PartialType } from '@nestjs/mapped-types';
import { CreateReportCardDto } from './create-report-card.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ReportCardStatus } from '../entities/report-card.entity';

export class UpdateReportCardDto extends PartialType(CreateReportCardDto) {
  @ApiProperty({
    enum: ReportCardStatus,
    description: 'Report card status',
    required: false,
  })
  @IsOptional()
  @IsEnum(ReportCardStatus)
  status?: ReportCardStatus;
}
