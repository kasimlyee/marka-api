import { Processor, Process } from '@nestjs/bull';

@Processor('import-processing')
export class ImportProcessor {}
