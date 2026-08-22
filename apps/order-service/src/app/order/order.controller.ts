import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @EventPattern('reservation.created')
  async handleReservationCreated(
    @Payload()
    data: {
      userId: string;
      reservationId: string;
      totalAmount: number;
      idempotencyKey: string;
    },
  ) {
    this.logger.log(
      `Nhận sự kiện tạo đơn hàng từ Reservation: ${data.reservationId}`,
    );

    await this.orderService.createOrder({
      userId: data.userId,
      reservationId: data.reservationId,
      totalAmount: data.totalAmount,
      idempotencyKey: data.idempotencyKey,
    });
  }
}
