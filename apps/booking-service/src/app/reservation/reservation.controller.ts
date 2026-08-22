import { Controller, Post, Param, Body, Logger } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateReservationDto, ReservationEventDto } from '@ticketing/entities';

@Controller('reservations')
export class ReservationController {
  private readonly logger = new Logger(ReservationController.name);
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  async makeReservation(@Body() data: CreateReservationDto) {
    return this.reservationService.makeReservation(data);
  }

  @Post(':id/cancel')
  async cancelReservation(@Param('id') reservationId: string) {
    return this.reservationService.cancelReservation(reservationId);
  }

  @EventPattern('order.payment_success')
  async handleOrderSuccess(@Payload() data: ReservationEventDto) {
    this.logger.log(
      `Nhận tín hiệu thanh toán thành công cho giữ chỗ: ${data.reservationId}`,
    );

    await this.reservationService.confirmReservation(data.reservationId);
  }

  @EventPattern('order.payment_failed')
  async handleOrderFailed(@Payload() data: ReservationEventDto) {
    this.logger.log(
      `Nhận tín hiệu thanh toán thất bại. Tiến hành hủy giữ chỗ: ${data.reservationId}`,
    );

    await this.reservationService.cancelReservation(data.reservationId);
  }
}
