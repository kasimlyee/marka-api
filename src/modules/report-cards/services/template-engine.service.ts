import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { GradingService } from '../../grading/grading.service';

@Injectable()
export class TemplateEngineService {
  private handlebars: typeof Handlebars;

  constructor(private readonly gradingService: GradingService) {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  private registerHelpers() {
    // Grade helper
    this.handlebars.registerHelper(
      'grade',
      (score: number, examLevel: string) => {
        return this.calculateGrade(score, examLevel);
      },
    );

    // Format number helper
    this.handlebars.registerHelper(
      'formatNumber',
      (num: number, decimals: number = 2) => {
        return Number(num).toFixed(decimals);
      },
    );

    // Date formatting helper
    this.handlebars.registerHelper(
      'formatDate',
      (date: Date, format: string = 'YYYY-MM-DD') => {
        // You can use moment.js or date-fns here
        return new Date(date).toLocaleDateString();
      },
    );

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a, b) => a === b);
    this.handlebars.registerHelper('gt', (a, b) => a > b);
    this.handlebars.registerHelper('lt', (a, b) => a < b);

    // Average calculation helper
    this.handlebars.registerHelper('average', (scores: number[]) => {
      const sum = scores.reduce((acc, score) => acc + score, 0);
      return scores.length > 0 ? sum / scores.length : 0;
    });
  }

  private calculateGrade(score: number, examLevel: string): string {
    // UNEB grading system
    if (examLevel === 'ple') {
      if (score >= 80) return '1';
      if (score >= 70) return '2';
      if (score >= 60) return '3';
      if (score >= 50) return '4';
      if (score >= 40) return '5';
      if (score >= 30) return '6';
      if (score >= 20) return '7';
      if (score >= 10) return '8';
      return '9';
    } else {
      // UCE/UACE
      if (score >= 80) return 'D1';
      if (score >= 70) return 'D2';
      if (score >= 65) return 'C3';
      if (score >= 60) return 'C4';
      if (score >= 55) return 'C5';
      if (score >= 50) return 'C6';
      if (score >= 45) return 'P7';
      if (score >= 40) return 'P8';
      return 'F9';
    }
  }

  compileTemplate(templateHtml: string): HandlebarsTemplateDelegate {
    return this.handlebars.compile(templateHtml);
  }

  renderTemplate(
    compiledTemplate: HandlebarsTemplateDelegate,
    data: any,
  ): string {
    return compiledTemplate(data);
  }
}
