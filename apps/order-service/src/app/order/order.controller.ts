import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import {
  PaymentStatus,
  ReservationCreatedEventDto,
  PaymentStatusEventDto,
  ReservationExpiredEventDto,
} from '@ticketing/entities';

@Controller()
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @EventPattern('reservation.created')
  async handleReservationCreated(@Payload() data: ReservationCreatedEventDto) {
    this.logger.log(
      `Nhận sự kiện tạo đơn hàng từ Reservation: ${data.reservationId}`,
    );

    await this.orderService.createOrder({
      userId: data.userId,
      reservationId: data.reservationId,
      totalAmount: data.totalAmount,
      idempotencyKey: data.idempotencyKey,
      ticketTierId: data.ticketTierId,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice: data.totalPrice,
    });
  }

  @EventPattern('payment.succeeded')
  async handlePaymentSucceeded(@Payload() data: PaymentStatusEventDto) {
    this.logger.log(
      `Nhận event [payment.succeeded] cho đơn hàng: ${data.orderId}`,
    );

    await this.orderService.updateOrderStatus(
      data.orderId,
      PaymentStatus.SUCCESS,
    );
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(@Payload() data: PaymentStatusEventDto) {
    this.logger.log(
      `Nhận event [payment.failed] cho đơn hàng: ${data.orderId}`,
    );

    await this.orderService.updateOrderStatus(
      data.orderId,
      PaymentStatus.FAILED,
    );
  }

  @EventPattern('reservation.expired')
  async handleReservationExpired(@Payload() data: ReservationExpiredEventDto) {
    await this.orderService.cancelExpiredOrder(data.reservationId);
  }
}
