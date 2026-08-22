import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import {
  Reservation,
  TicketTier,
  ReservationStatus,
} from '@ticketing/entities';
import { DataSource, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ReservationService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('RESERVATION_SERVICE')
    private readonly reservationClient: ClientProxy,
  ) {}

  async makeReservation(data: {
    userId: string;
    eventId: string;
    ticketTierId: string;
    quantity: number;
  }): Promise<Reservation> {
    return await this.dataSource.transaction(async (manager) => {
      const ticketTier = await manager.findOne(TicketTier, {
        where: { id: data.ticketTierId },
      });

      if (!ticketTier) {
        throw new BadRequestException('Hạng vé không tồn tại');
      }

      const updateResult = await manager
        .createQueryBuilder()
        .update(TicketTier)
        .set({
          availableQuantity: () => `availableQuantity - ${data.quantity}`,
        })
        .where('id = :id AND availableQuantity >= :quantity', {
          id: data.ticketTierId,
          quantity: data.quantity,
        })
        .execute();

      if (updateResult.affected === 0) {
        throw new BadRequestException(
          'Hạng vé đã hết hoặc không đủ số lượng yêu cầu',
        );
      }

      const reservation = manager.create(Reservation, {
        ...data,
        status: ReservationStatus.PENDING,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const savedReservation = await manager.save(reservation);

      const totalAmount = ticketTier.price * data.quantity;

      await this.reservationClient.emit('reservation.created', {
        userId: savedReservation.userId,
        reservationId: savedReservation.id,
        totalAmount: totalAmount,
        idempotencyKey: `order_res_${savedReservation.id}`,
      });

      return savedReservation;
    });
  }

  async cancelReservation(reservationId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // 1. Cập nhật trạng thái chỉ khi đơn đang là PENDING (tránh cancel 2 lần)
      const updateResult = await manager
        .createQueryBuilder()
        .update(Reservation)
        .set({ status: ReservationStatus.CANCELLED })
        .where('id = :id AND status = :status', {
          id: reservationId,
          status: ReservationStatus.PENDING,
        })
        .execute();

      if (updateResult.affected === 0) {
        throw new BadRequestException(
          'Đơn giữ chỗ không tồn tại hoặc không ở trạng thái hợp lệ để hủy',
        );
      }

      // 2. Lấy thông tin để hoàn vé
      const reservation = await manager.findOne(Reservation, {
        where: { id: reservationId },
      });

      if (reservation) {
        await manager
          .createQueryBuilder()
          .update(TicketTier)
          .set({
            availableQuantity: () =>
              `availableQuantity + ${reservation.quantity}`,
          })
          .where('id = :id', { id: reservation.ticketTierId })
          .execute();
      }
    });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleExpiredReservations() {
    await this.dataSource.transaction(async (manager) => {
      // 1. Lấy danh sách các đơn giữ chỗ đã hết hạn
      const expiredReservations = await manager.find(Reservation, {
        where: {
          status: ReservationStatus.PENDING,
          expiresAt: LessThan(new Date()),
        },
      });

      for (const reservation of expiredReservations) {
        // Cập nhật trạng thái EXPIRED
        const updateResult = await manager
          .createQueryBuilder()
          .update(Reservation)
          .set({ status: ReservationStatus.EXPIRED })
          .where('id = :id AND status = :status', {
            id: reservation.id,
            status: ReservationStatus.PENDING,
          })
          .execute();

        // Nếu update thành công thì hoàn lại vé
        if (updateResult.affected === 1) {
          await manager
            .createQueryBuilder()
            .update(TicketTier)
            .set({
              availableQuantity: () =>
                `availableQuantity + ${reservation.quantity}`,
            })
            .where('id = :id', { id: reservation.ticketTierId })
            .execute();
        }
      }
    });
  }
}
