/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { CommonModule } from '@ticketing/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '@ticketing/entities';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Order])],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
