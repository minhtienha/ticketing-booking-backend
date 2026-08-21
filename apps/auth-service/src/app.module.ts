import { Module } from '@nestjs/common';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth, User } from '@ticketing/entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([Auth, User]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
