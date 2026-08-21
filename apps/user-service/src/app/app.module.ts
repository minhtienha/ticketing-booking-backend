import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@ticketing/entities';
import { AppGrpcController } from './app.controller.grpc';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([User])],
  controllers: [AppController, AppGrpcController],
  providers: [AppService],
})
export class AppModule {}
