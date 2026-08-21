/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport } from '@nestjs/microservices';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );

  console.log(
    `\nĐường dẫn file proto user: ${path.resolve(__dirname, 'protos/users.proto')}`,
  );

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: path.resolve(__dirname, 'protos/users.proto'),
      url: '0.0.0.0:5000',
    },
  });

  await app.startAllMicroservices();
}

bootstrap();
