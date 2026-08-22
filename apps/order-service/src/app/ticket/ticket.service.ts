import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus, OrderItem } from '@ticketing/entities';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async createTickets(data: { orderId: string; status: TicketStatus }) {
    const existingTicketsCount = await this.ticketRepository.count({
      where: { orderId: data.orderId },
    });

    if (existingTicketsCount > 0) {
      this.logger.warn(
        `Đơn hàng ${data.orderId} đã được xuất vé. Bỏ qua để tránh trùng lặp.`,
      );
      return;
    }

    const orderItems = await this.orderItemRepository.find({
      where: { orderId: data.orderId },
    });

    if (!orderItems.length) {
      this.logger.error(
        `Không tìm thấy chi tiết đơn hàng cho Order ID: ${data.orderId}`,
      );
      return;
    }

    const ticketsToCreate = [];

    for (const item of orderItems) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketCode = `TICK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        ticketsToCreate.push(
          this.ticketRepository.create({
            orderId: data.orderId,
            ticketCode: ticketCode,
            status: data.status,
          }),
        );
      }
    }

    await this.ticketRepository.save(ticketsToCreate);

    this.logger.log(
      `Đã xuất thành công ${ticketsToCreate.length} vé cho đơn hàng: ${data.orderId}`,
    );
  }
}
