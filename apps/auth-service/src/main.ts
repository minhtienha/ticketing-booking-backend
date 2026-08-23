/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    // .setTitle('Cats example')
    // .setDescription('The cats API description')
    // .setVersion('1.0')
    // .addTag('cats')
    .setOpenAPIVersion('3.2.0')
    .addTag('Animals', 'Everything about animals', undefined, { kind: 'nav' })
    .addTag('Cats', 'Cat operations', undefined, { parent: 'Animals' })
    .addTag('Dogs', 'Dog operations', undefined, { parent: 'Animals' })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.useGlobalPipes(new ZodValidationPipe());
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
