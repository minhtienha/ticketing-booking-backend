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
  CreateReservationCommandDto,
} from '@ticketing/entities';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  private readonly HOLD_TTL_SECONDS = 15;

  constructor(
    private readonly dataSource: DataSource,
    @Inject('ORDER_SERVICE_CLIENT')
    private readonly orderClient: ClientProxy,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(TicketTier)
    private readonly ticketTierRepository: Repository<TicketTier>,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async makeReservation(
    data: CreateReservationCommandDto,
  ): Promise<Reservation> {
    const ticketTier = await this.ticketTierRepository.findOne({
      where: { id: data.ticketTierId },
    });

    if (!ticketTier) {
      throw new BadRequestException('Hạng vé không tồn tại');
    }

    // 1. Giữ vé bằng DB Transaction
    const savedReservation = await this.dataSource.transaction(
      async (manager) => {
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

        // Tạo và lưu Reservation
        const reservation = manager.create(Reservation, {
          ...data,
          status: ReservationStatus.PENDING,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        return await manager.save(reservation);
      },
    );

    // 2. Đặt TTL trên Redis với prefix dễ quản lý
    // Key format: reservation:hold:{reservationId}
    const redisKey = `reservation:hold:${savedReservation.id}`;
    await this.redisClient.set(redisKey, '1', 'EX', this.HOLD_TTL_SECONDS);

    // 3. Emit event tạo đơn hàng sang order-service
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
  }

  async confirmReservation(reservationId: string): Promise<Reservation> {
    const updated = await this.dataSource.transaction(async (manager) => {
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
      return await manager.save(reservation);
    });

    // XÓA KEY TRÊN REDIS: để không bị bắn expired event nữa
    await this.redisClient.del(`reservation:hold:${reservationId}`);

    return updated;
  }

  async processExpiredReservation(reservationId: string): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        // Cập nhật trạng thái EXPIRED
        const updateResult = await manager
          .createQueryBuilder()
          .update(Reservation)
          .set({ status: ReservationStatus.EXPIRED })
          .where('id = :id AND status = :status', {
            id: reservationId,
            status: ReservationStatus.PENDING,
          })
          .execute();

        if (updateResult.affected === 1) {
          const reservation = await manager.findOne(Reservation, {
            where: { id: reservationId },
          });
          if (reservation) {
            await manager
              .createQueryBuilder()
              .update(TicketTier)
              .set({
                availableQuantity: () =>
                  `"availableQuantity" + ${reservation.quantity}`,
              })
              .where('id = :id', { id: reservation.ticketTierId })
              .execute();
            this.logger.log(
              `[Redis Expiration] Đã nhả vé cho Reservation: ${reservationId}`,
            );
            // Bắn event để order-service hủy đơn
            this.orderClient.emit('reservation.expired', {
              reservationId: reservation.id,
            });
          }
        }
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi xử lý hết hạn cho reservation ${reservationId}`,
        error,
      );
    }
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredReservations() {
    const expiredReservations = await this.reservationRepository.find({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      take: 100,
    });

    if (expiredReservations.length === 0) return;

    for (const reservation of expiredReservations) {
      try {
        await this.dataSource.transaction(async (manager) => {
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
                  `"availableQuantity" + ${reservation.quantity}`,
              })
              .where('id = :id', { id: reservation.ticketTierId })
              .execute();

            this.orderClient.emit('reservation.expired', {
              reservationId: reservation.id,
            });
          }
        });
      } catch (error) {
        this.logger.error(
          `Lỗi khi xử lý nhả vé cho Reservation ${reservation.id}`,
          error,
        );
      }
    }
  }
}
