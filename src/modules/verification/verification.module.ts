import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { Verification } from './entities/verification.entity';
import { UsersModule } from '../users/users.module';
import { SmsModule } from '../../common/services/sms/sms.module';
import { EmailModule } from '../../common/services/email/email.module';
import { CacheModule } from '@nestjs/cache-manager';
import { VerificationController } from './verification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Verification]),
    UsersModule,
    SmsModule,
    EmailModule,
    CacheModule.register(),
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
