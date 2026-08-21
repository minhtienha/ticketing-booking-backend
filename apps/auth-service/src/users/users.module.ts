import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@ticketing/entities';
import { UsersGrpcController } from './users.controller.grpc';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController, UsersGrpcController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
