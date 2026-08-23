import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  Reservation,
  TicketTier,
  ReservationStatus,
  CreateReservationDto,
} from '@ticketing/entities';
import { DataSource, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject('ORDER_SERVICE_CLIENT')
    private readonly orderClient: ClientProxy,
  ) {}

  async makeReservation(data: CreateReservationDto): Promise<Reservation> {
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

      await this.orderClient.emit('reservation.created', {
        userId: savedReservation.userId,
        reservationId: savedReservation.id,
        totalAmount: totalAmount,
        idempotencyKey: `order_res_${savedReservation.id}`,
        ticketTierId: savedReservation.ticketTierId,
        quantity: savedReservation.quantity,
        unitPrice: ticketTier.price,
        totalPrice: totalAmount,
      });

      return savedReservation;
    });
  }

  async confirmReservation(reservationId: string): Promise<Reservation> {
    return await this.dataSource.transaction(async (manager) => {
      const reservation = await manager.findOne(Reservation, {
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException(
          `Không tìm thấy Reservation ID: ${reservationId}`,
        );
      }

      if (reservation.status === ReservationStatus.CONFIRMED) {
        this.logger.warn(`Giữ chỗ ${reservationId} đã được xác nhận trước đó.`);
        return reservation;
      }

      reservation.status = ReservationStatus.CONFIRMED;
      const updatedReservation = await manager.save(reservation);

      this.logger.log(`Hoàn tất chốt vé cho Reservation: ${reservationId}`);
      return updatedReservation;
    });
  }

  async cancelReservation(
    reservationId: string,
    userId: string,
  ): Promise<void> {
    await this.cancelReservationByScope(reservationId, userId);
  }

  async cancelReservationInternal(reservationId: string): Promise<void> {
    await this.cancelReservationByScope(reservationId);
  }

  private async cancelReservationByScope(
    reservationId: string,
    userId?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const where = userId
        ? 'id = :id AND userId = :userId AND status = :status'
        : 'id = :id AND status = :status';
      const parameters = userId
        ? { id: reservationId, userId, status: ReservationStatus.PENDING }
        : { id: reservationId, status: ReservationStatus.PENDING };

      const updateResult = await manager
        .createQueryBuilder()
        .update(Reservation)
        .set({ status: ReservationStatus.CANCELLED })
        .where(where, parameters)
        .execute();

      if (updateResult.affected === 0) {
        throw new BadRequestException(
          'Đơn giữ chỗ không tồn tại hoặc không ở trạng thái hợp lệ để hủy',
        );
      }

      // Lấy thông tin để hoàn vé
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

          this.orderClient.emit('reservation.expired', {
            reservationId: reservation.id,
          });
        }
      }
    });
  }
}
