/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation, TicketTier, Event } from '@ticketing/entities';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Reservation, TicketTier, Event]),
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'order_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
