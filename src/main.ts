import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
  TenantInterceptor,
  TimeoutInterceptor,
  RateLimitInterceptor,
} from '@marka/common';
import { TenantService } from './modules/tenants/tenants.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  const tenantService = app.get(TenantService);
  const tenantInterceptor = TenantInterceptor.create(tenantService);
  // Global interceptors
  app.useGlobalInterceptors(
    tenantInterceptor,
    new TimeoutInterceptor(),
    new RateLimitInterceptor(),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Marka - Report Card SaaS API')
    .setDescription('UNEB-compliant report card generator for Ugandan schools')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  //Global Prefix
  app.setGlobalPrefix('api/v1');

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
