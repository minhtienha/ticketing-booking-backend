/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ZodValidationPipe } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';

  const config = new DocumentBuilder()
    .setTitle('Order Service API')
    .setDescription(
      'API documentation for Order Creation, Order Status Tracking, and History',
    )
    .setVersion('1.0')
    .addServer('/api')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Dán JWT Access Token vào đây',
        in: 'header',
      },
      'access-token',
    )
    .addTag(
      'orders',
      'Endpoints for managing orders, checkout flows, and user order history',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix(globalPrefix);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'order_queue',
      queueOptions: {
        durable: true,
      },
    },
  });
  app.useGlobalPipes(new ZodValidationPipe());
  const port = process.env.PORT || 3004;

  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
