/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { CommonModule } from '@ticketing/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem, Ticket, TicketTier } from '@ticketing/entities';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Order, OrderItem, Ticket, TicketTier, Event]),
    ClientsModule.register([
      {
        name: 'RESERVATION_SERVICE_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'reservation_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    TicketModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
