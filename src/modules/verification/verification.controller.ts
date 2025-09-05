// src/verification/verification.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/user.entity';
import { VerificationType, VerificationChannel } from './verification.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('verification')
@ApiBearerAuth()
@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate verification process' })
  @ApiResponse({
    status: 201,
    description: 'Verification initiated successfully',
  })
  async initiateVerification(
    @CurrentUser() user: User,
    @Body()
    body: {
      type: VerificationType;
      target: string;
      channel: VerificationChannel;
      metadata?: Record<string, any>;
    },
  ) {
    const result = await this.verificationService.initiateVerification(
      user.id,
      body.type,
      body.target,
      body.channel,
      body.metadata,
    );

    return {
      message: 'Verification code sent successfully',
      token: result.token,
      expiresAt: result.expiresAt,
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify code' })
  @ApiResponse({ status: 200, description: 'Verification successful' })
  async verifyCode(
    @Body() body: { token: string; code: string; type: VerificationType },
  ) {
    return this.verificationService.verifyCode(
      body.token,
      body.code,
      body.type,
    );
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 200, description: 'Code resent successfully' })
  async resendCode(@Body() body: { token: string }) {
    return this.verificationService.resendCode(body.token);
  }

  @Get('status/:token')
  @ApiOperation({ summary: 'Check verification status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async checkStatus(
    @Param('token') token: string,
    @Query('type') type: VerificationType,
  ) {
    const isValid = await this.verificationService.validateVerificationToken(
      token,
      type,
    );
    return { valid: isValid };
  }
}
