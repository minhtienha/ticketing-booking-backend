import {
  Controller,
  Post,
  Param,
  Body,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateReservationDto, ReservationEventDto } from '@ticketing/entities';
import { CurrentUser, JwtAuthGuard } from '@ticketing/common';

@Controller('reservations')
export class ReservationController {
  private readonly logger = new Logger(ReservationController.name);
  constructor(private readonly reservationService: ReservationService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async makeReservation(
    @CurrentUser() user: any,
    @Body() data: CreateReservationDto,
  ) {
    return this.reservationService.makeReservation({
      ...data,
      userId: user.id,
    });
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
