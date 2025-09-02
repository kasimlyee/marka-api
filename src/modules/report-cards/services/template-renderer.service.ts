import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';

@Injectable()
export class TemplateRendererService {
  private readonly logger = new Logger(TemplateRendererService.name);

  constructor() {
    this.registerHelpers();
  }

  async render(template: string, data: any): Promise<string> {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error('Failed to render template:', error);
      throw error;
    }
  }

  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return '';

      const d = new Date(date);
      switch (format) {
        case 'short':
          return d.toLocaleDateString('en-GB');
        case 'long':
          return d.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        case 'month-year':
          return d.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
          });
        default:
          return d.toLocaleDateString('en-GB');
      }
    });

    // Grade color helper
    Handlebars.registerHelper('gradeColor', (grade: string) => {
      const colors = {
        A: '#4CAF50',
        B: '#8BC34A',
        C: '#FFC107',
        D: '#FF9800',
        E: '#FF5722',
        F: '#F44336',
        D1: '#4CAF50',
        D2: '#8BC34A',
        C3: '#CDDC39',
        C4: '#FFEB3B',
        C5: '#FFC107',
        C6: '#FF9800',
        P7: '#FF5722',
        P8: '#F44336',
        F9: '#9C27B0',
        O: '#607D8B',
      };
      return colors[grade] || '#9E9E9E';
    });

    // Number formatting
    Handlebars.registerHelper(
      'number',
      (value: number, decimals: number = 0) => {
        if (typeof value !== 'number') return value;
        return value.toFixed(decimals);
      },
    );

    // Conditional helpers
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    Handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

    // String helpers
    Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
    Handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Math helpers
    Handlebars.registerHelper('add', (a: number, b: number) => a + b);
    Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    Handlebars.registerHelper('divide', (a: number, b: number) =>
      b !== 0 ? a / b : 0,
    );

    // Array helpers
    Handlebars.registerHelper('length', (array: any[]) => array?.length || 0);
    Handlebars.registerHelper('first', (array: any[]) => array?.[0]);
    Handlebars.registerHelper(
      'last',
      (array: any[]) => array?.[array.length - 1],
    );

    // Grade interpretation helper
    Handlebars.registerHelper(
      'gradeInterpretation',
      (grade: string, examLevel: string) => {
        const interpretations = {
          PLE: {
            D1: 'Distinction',
            D2: 'Distinction',
            C3: 'Credit',
            C4: 'Credit',
            C5: 'Credit',
            C6: 'Credit',
            P7: 'Pass',
            P8: 'Pass',
            F9: 'Fail',
          },
          UCE: {
            A: 'Excellent',
            B: 'Very Good',
            C: 'Good',
            D: 'Satisfactory',
            E: 'Pass',
            F: 'Fail',
          },
          UACE: {
            A: 'Excellent',
            B: 'Very Good',
            C: 'Good',
            D: 'Satisfactory',
            E: 'Pass',
            O: 'Ordinary Pass',
            F: 'Fail',
          },
        };

        return interpretations[examLevel]?.[grade] || 'N/A';
      },
    );
  }
}
