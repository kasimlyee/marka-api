import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { Assessment } from './assessment.entity';
import { GradingModule } from '../grading/grading.module';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment]), GradingModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
