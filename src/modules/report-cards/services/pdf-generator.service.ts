import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private browser: puppeteer.Browser;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async generatePdfFromHtml(
    html: string,
    options?: {
      fileName?: string;
      format?: 'A4' | 'A3' | 'Letter';
      orientation?: 'portrait' | 'landscape';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    },
  ): Promise<{ filePath: string; buffer: Buffer }> {
    const page = await this.browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfOptions: puppeteer.PDFOptions = {
        format: options?.format || 'A4',
        landscape: options?.orientation === 'landscape',
        margin: options?.margin || {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
        printBackground: true,
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      // Save to file system
      const fileName = options?.fileName || `report_${Date.now()}.pdf`;
      const uploadsDir = this.configService.get(
        'UPLOADS_DIR',
        './uploads/reports',
      );
      await fs.mkdir(uploadsDir, { recursive: true });

      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, pdfBuffer);

      this.logger.log(`PDF generated successfully: ${fileName}`);

      return { filePath, buffer: pdfBuffer };
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await page.close();
    }
  }
}
