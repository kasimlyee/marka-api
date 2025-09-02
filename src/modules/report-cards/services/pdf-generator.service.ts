import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PdfOptions {
  format?: 'A4' | 'A3' | 'Letter';
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  landscape?: boolean;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private browser: puppeteer.Browser;
  private readonly pdfStoragePath: string;

  constructor(private readonly configService: ConfigService) {
    this.pdfStoragePath = this.configService.get<string>(
      'PDF_STORAGE_PATH',
      './storage/pdfs',
    );
    this.initializeBrowser();
  }

  private async initializeBrowser(): Promise<void> {
    try {
      /**
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      });*/

      this.logger.log('PDF generator browser initialized');
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async generatePdf(
    htmlContent: string,
    filename: string,
    options: PdfOptions = {},
  ): Promise<string> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.pdfStoragePath, { recursive: true });

      const page = await this.browser.newPage();

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle2',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: options.printBackground ?? true,
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
        landscape: options.landscape ?? false,
      });

      await page.close();

      // Save to file
      const pdfPath = path.join(this.pdfStoragePath, `${filename}.pdf`);
      await fs.writeFile(pdfPath, pdfBuffer);

      this.logger.log(`PDF generated successfully: ${pdfPath}`);

      return pdfPath;
    } catch (error) {
      this.logger.error(`Failed to generate PDF for ${filename}:`, error);
      throw error;
    }
  }

  async deletePdf(pdfPath: string): Promise<void> {
    try {
      await fs.unlink(pdfPath);
      this.logger.log(`PDF deleted: ${pdfPath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete PDF ${pdfPath}:`, error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('PDF generator browser closed');
    }
  }
}
