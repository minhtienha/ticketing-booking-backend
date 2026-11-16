import { Module, Global, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const client = new Redis(
          process.env.REDIS_URL || 'redis://localhost:6379',
        );
        client.on('error', (err) =>
          Logger.error('Lỗi kết nối Redis Client:', err.message),
        );
        return client;
      },
    },
    {
      provide: REDIS_SUBSCRIBER,
      useFactory: () => {
        const subscriber = new Redis(
          process.env.REDIS_URL || 'redis://localhost:6379',
        );
        subscriber.on('error', (err) =>
          Logger.error('Lỗi kết nối Redis Subscriber:', err.message),
        );
        return subscriber;
      },
    },
  ],
  exports: [REDIS_CLIENT, REDIS_SUBSCRIBER],
})
export class RedisModule {}
