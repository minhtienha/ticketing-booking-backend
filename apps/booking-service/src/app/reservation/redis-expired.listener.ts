import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_SUBSCRIBER } from '../redis/redis.module';
import { ReservationService } from './reservation.service';

@Injectable()
export class RedisExpiredListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisExpiredListener.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER)
    private readonly subscriber: Redis,
    private readonly reservationService: ReservationService,
  ) {}

  async onModuleInit() {
    // Đăng ký channel sự kiện hết hạn cho mọi database (__keyevent@*__:expired)
    // hoặc cụ thể database 0: __keyevent@0__:expired
    const expiredChannel = '__keyevent@*__:expired';

    await this.subscriber.psubscribe(expiredChannel);
    this.logger.log(`Đã subscribe channel: ${expiredChannel}`);

    this.subscriber.on(
      'pmessage',
      async (pattern, channel, expiredKey: string) => {
        // Kiểm tra xem key có đúng format `reservation:hold:{id}` không
        const prefix = 'reservation:hold:';
        if (expiredKey.startsWith(prefix)) {
          const reservationId = expiredKey.replace(prefix, '');
          this.logger.warn(`Phát hiện đơn giữ chỗ hết hạn: ${reservationId}`);

          // Gọi service xử lý nhả vé
          await this.reservationService.processExpiredReservation(
            reservationId,
          );
        }
      },
    );
  }

  async onModuleDestroy() {
    await this.subscriber.punsubscribe();
  }
}
