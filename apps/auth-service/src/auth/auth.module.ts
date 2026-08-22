import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Auth } from '@ticketing/entities';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as path from 'path';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([User, Auth]),
    UsersModule,
    ClientsModule.register([
      {
        name: 'USERS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'users',
          protoPath: path.join(__dirname, 'protos/users.proto'),
          url: 'localhost:5000',
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
