import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateDto } from './create-report-card-template.dto';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}
