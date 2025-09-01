import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { EmailTemplate } from './interfaces/email.interface';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly templatesPath: string;
  private templates: Map<string, EmailTemplate> = new Map();
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> =
    new Map();

  constructor(private readonly configService: ConfigService) {
    this.templatesPath = this.configService.get('email.templates.path');
    this.registerHelpers();
    this.loadTemplates();
  }

  private registerHelpers(): void {
    // Register common Handlebars helpers
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('ne', (a, b) => a !== b);
    Handlebars.registerHelper('lt', (a, b) => a < b);
    Handlebars.registerHelper('gt', (a, b) => a > b);
    Handlebars.registerHelper('and', (a, b) => a && b);
    Handlebars.registerHelper('or', (a, b) => a || b);
    Handlebars.registerHelper('not', (a) => !a);

    Handlebars.registerHelper('formatDate', (date, format) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    });

    Handlebars.registerHelper('formatCurrency', (amount, currency = 'UGX') => {
      if (!amount) return '';
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    });
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templateDirs = await fs.readdir(this.templatesPath);

      for (const templateDir of templateDirs) {
        const templatePath = path.join(this.templatesPath, templateDir);
        const stat = await fs.stat(templatePath);

        if (stat.isDirectory()) {
          await this.loadTemplate(templateDir, templatePath);
        }
      }

      this.logger.log(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.error('Failed to load templates', error);
    }
  }

  private async loadTemplate(
    templateId: string,
    templatePath: string,
  ): Promise<void> {
    try {
      const configPath = path.join(templatePath, 'config.json');
      const htmlPath = path.join(templatePath, 'template.html');
      const textPath = path.join(templatePath, 'template.txt');

      const [configExists, htmlExists, textExists] = await Promise.all([
        fs.pathExists(configPath),
        fs.pathExists(htmlPath),
        fs.pathExists(textPath),
      ]);

      if (!configExists || !htmlExists) {
        this.logger.warn(`Template ${templateId} missing required files`);
        return;
      }

      const [config, html, text] = await Promise.all([
        fs.readJson(configPath),
        fs.readFile(htmlPath, 'utf8'),
        textExists ? fs.readFile(textPath, 'utf8') : undefined,
      ]);

      const template: EmailTemplate = {
        id: templateId,
        name: config.name || templateId,
        subject: config.subject || '',
        html,
        text,
        variables: config.variables || [],
        category: config.category || 'general',
        active: config.active !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.templates.set(templateId, template);

      // Compile templates
      this.compiledTemplates.set(
        `${templateId}_html`,
        Handlebars.compile(html),
      );
      this.compiledTemplates.set(
        `${templateId}_subject`,
        Handlebars.compile(template.subject),
      );

      if (text) {
        this.compiledTemplates.set(
          `${templateId}_text`,
          Handlebars.compile(text),
        );
      }
    } catch (error) {
      this.logger.error(`Failed to load template ${templateId}`, error);
    }
  }

  async processTemplate(
    templateId: string,
    data: Record<string, any>,
  ): Promise<{ html: string; text?: string; subject: string }> {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    if (!template.active) {
      throw new Error(`Template ${templateId} is inactive`);
    }

    try {
      const htmlCompiled = this.compiledTemplates.get(`${templateId}_html`);
      const subjectCompiled = this.compiledTemplates.get(
        `${templateId}_subject`,
      );
      const textCompiled = this.compiledTemplates.get(`${templateId}_text`);

      const result = {
        html: htmlCompiled(data),
        subject: subjectCompiled(data),
        text: textCompiled ? textCompiled(data) : undefined,
      };

      return result;
    } catch (error) {
      this.logger.error(`Failed to process template ${templateId}`, error);
      throw error;
    }
  }

  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): EmailTemplate[] {
    return Array.from(this.templates.values()).filter(
      (template) => template.category === category,
    );
  }

  async reloadTemplates(): Promise<void> {
    this.templates.clear();
    this.compiledTemplates.clear();
    await this.loadTemplates();
  }
}
