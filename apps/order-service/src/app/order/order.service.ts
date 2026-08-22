import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { ClientProxy } from '@nestjs/microservices';
import { Order, PaymentStatus } from '@ticketing/entities';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    // @Inject('ORDER_SERVICE')
    // private readonly orderClient: ClientProxy,
  ) {}

  /**
   * 1. Tạo đơn hàng mới (Chống trùng lặp qua Idempotency Key)
   */
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

  // /**
  //  * 2. Cập nhật trạng thái thanh toán (Được gọi khi VNPay/Momo gửi Webhook về)
  //  */
  // async updatePaymentStatus(
  //   orderId: string,
  //   status: PaymentStatus,
  // ): Promise<Order> {
  //   const order = await this.orderRepository.findOne({
  //     where: { id: orderId },
  //   });

  //   if (!order) {
  //     throw new NotFoundException('Không tìm thấy đơn hàng');
  //   }

  //   if (order.paymentStatus === PaymentStatus.SUCCESS) {
  //     this.logger.log(
  //       `Đơn hàng ${orderId} đã được thanh toán trước đó, bỏ qua update.`,
  //     );
  //     return order;
  //   }

  //   order.paymentStatus = status;
  //   await this.orderRepository.save(order);

  //   if (status === PaymentStatus.SUCCESS) {
  //     this.orderClient.emit('order.payment_success', {
  //       orderId: order.id,
  //       reservationId: order.reservationId,
  //       userId: order.userId,
  //     });
  //     this.logger.log(`Đã thanh toán đơn ${orderId} - Phát sự kiện chốt vé.`);
  //   } else if (status === PaymentStatus.FAILED) {
  //     this.orderClient.emit('order.payment_failed', {
  //       reservationId: order.reservationId,
  //     });
  //     this.logger.log(
  //       `Thanh toán thất bại đơn ${orderId} - Phát sự kiện nhả vé.`,
  //     );
  //   }

  //   return order;
  // }

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
