import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Order, PaymentStatus } from '@ticketing/entities';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @Inject('RESERVATION_SERVICE_CLIENT')
    private readonly orderClient: ClientProxy,
  ) {}

  async createOrder(data: {
    userId: string;
    reservationId: string;
    totalAmount: number;
    idempotencyKey: string;
  }): Promise<Order> {
    try {
      const newOrder = this.orderRepository.create({
        userId: data.userId,
        reservationId: data.reservationId,
        totalAmount: data.totalAmount,
        idempotencyKey: data.idempotencyKey,
        paymentStatus: PaymentStatus.PENDING,
      });

      const savedOrder = await this.orderRepository.save(newOrder);
      this.logger.log(`Tạo đơn hàng thành công: ${savedOrder.id}`);

      return savedOrder;
    } catch (error: any) {
      if (error.code === '23505') {
        this.logger.warn(
          `Idempotency hit: Cố gắng tạo lại đơn hàng với key ${data.idempotencyKey}`,
        );
        throw new ConflictException(
          'Đơn hàng này đang được xử lý, vui lòng không gửi lại yêu cầu.',
        );
      }
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: PaymentStatus,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      this.logger.error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
      return null;
    }

    if (order.paymentStatus === status) {
      this.logger.log(
        `Đơn hàng ${orderId} đã ở trạng thái ${status}, bỏ qua cập nhật.`,
      );
      return order;
    }

    order.paymentStatus = status;
    const updatedOrder = await this.orderRepository.save(order);

    this.logger.log(`Đã cập nhật trạng thái đơn ${orderId} thành ${status}`);

    if (status === PaymentStatus.SUCCESS) {
      this.orderClient.emit('order.payment_success', {
        reservationId: updatedOrder.reservationId,
      });
    } else if (status === PaymentStatus.FAILED) {
      this.orderClient.emit('order.payment_failed', {
        reservationId: updatedOrder.reservationId,
      });
    }

    return updatedOrder;
  }

  async cancelExpiredOrder(reservationId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: {
        reservationId: reservationId,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    if (!order) {
      return;
    }

    order.paymentStatus = PaymentStatus.FAILED;
    await this.orderRepository.save(order);

    this.logger.log(
      `Đã hủy đơn hàng ${order.id} do quá hạn giữ chỗ (Reservation: ${reservationId})`,
    );
  }

  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllOrders(
    page = 1,
    limit = 10,
  ): Promise<{ data: Order[]; total: number }> {
    const [data, total] = await this.orderRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }
}
