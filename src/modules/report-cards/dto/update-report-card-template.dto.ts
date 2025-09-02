import { PartialType } from '@nestjs/mapped-types';
import { CreateReportCardTemplateDto } from './create-report-card-template.dto';

export class UpdateReportCardTemplateDto extends PartialType(
  CreateReportCardTemplateDto,
) {}
