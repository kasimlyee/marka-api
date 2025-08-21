import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportProcessor } from './import.processor';
import { ImportJob } from './import-job.entity';
import { StudentsModule } from '@marka/modules/students';
import { SubjectsModule } from '@marka/modules/subjects';
import { AssessmentsModule } from '@marka/modules/assessments';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImportJob]),
    BullModule.registerQueue({
      name: 'import-processing',
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    StudentsModule,
    SubjectsModule,
    AssessmentsModule,
  ],
  controllers: [ImportController],
  providers: [ImportService, ImportProcessor],
  exports: [ImportService],
})
export class ImportModule {}
