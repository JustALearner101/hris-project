import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('CRM-Backend');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('HRIS x CRM & PSA API')
    .setDescription(
      'Professional Services Automation & Sales Pipeline Microservice for HRIS Monorepo',
    )
    .setVersion('1.0')
    .addTag('CRM', 'Leads, Accounts, Contacts, and Deal Pipeline')
    .addTag(
      'PSA (Professional Services Automation)',
      'Projects, Resource Allocations, Heatmaps, and Timesheets',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT || 8082;
  await app.listen(port);
  logger.log(`CRM & PSA Microservice running on http://localhost:${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/swagger`);
}

bootstrap();
