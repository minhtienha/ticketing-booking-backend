/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Post, Param, Body } from '@nestjs/common';
import { ReservationService } from './reservation.service';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  async makeReservation(
    @Body()
    data: {
      userId: string;
      eventId: string;
      ticketTierId: string;
      quantity: number;
    },
  ) {
    return this.reservationService.makeReservation(data);
  }

  @Post(':id/cancel')
  async cancelReservation(@Param('id') reservationId: string) {
    return this.reservationService.cancelReservation(reservationId);
  }
}
