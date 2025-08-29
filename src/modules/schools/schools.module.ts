import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { School } from './school.entity';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [TypeOrmModule.forFeature([School]), StoreModule],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
