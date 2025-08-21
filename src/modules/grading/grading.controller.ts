import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { GradingService } from './grading.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@marka/modules/auth';
import { Role } from '@marka/modules/users';
import { ExamLevel } from '@marka/modules/assessments';

@ApiTags('grading')
@Controller('grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Get('calculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate grade for a score' })
  @ApiResponse({ status: 200, description: 'Return calculated grade' })
  async calculateGrade(
    @Query('score') score: number,
    @Query('examLevel') examLevel: ExamLevel,
  ) {
    return this.gradingService.calculateGrade(score, examLevel);
  }

  @Post('ple/calculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate PLE results' })
  @ApiResponse({ status: 200, description: 'Return PLE results' })
  async calculatePLEResults(@Body() assessments: any[]) {
    return this.gradingService.calculatePLEResults(assessments);
  }

  @Post('uce/calculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate UCE results' })
  @ApiResponse({ status: 200, description: 'Return UCE results' })
  async calculateUCEResults(@Body() assessments: any[]) {
    return this.gradingService.calculateUCEResults(assessments);
  }

  @Post('uace/calculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate UACE results' })
  @ApiResponse({ status: 200, description: 'Return UACE results' })
  async calculateUACEResults(@Body() assessments: any[]) {
    return this.gradingService.calculateUACEResults(assessments);
  }
}
