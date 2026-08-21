/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation, TicketTier, Event } from '@ticketing/entities';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Reservation, TicketTier, Event]),
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
