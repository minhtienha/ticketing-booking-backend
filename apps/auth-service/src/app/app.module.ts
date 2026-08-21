import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Auth } from '@ticketing/entities';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as path from 'path';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([User, Auth]),
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
