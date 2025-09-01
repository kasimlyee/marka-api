import { Controller, Get, Header, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('test-mail')
  async testMail(): Promise<string> {
    const success = await this.appService.testMail();
    if (success) {
      return 'Email sent successfully';
    }
    return 'Email sending failed';
  }
}
