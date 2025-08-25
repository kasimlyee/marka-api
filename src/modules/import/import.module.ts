import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportProcessor } from './import.processor';
import { ImportJob } from './import-job.entity';
import { StudentsModule } from '../students/students.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { AssessmentsModule } from '../assessments/assessments.module';

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
