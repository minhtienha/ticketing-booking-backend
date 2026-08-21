import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { CommonModule } from '@ticketing/common';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { KeyvCacheableMemory } from 'cacheable';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event, TicketTier } from '@ticketing/entities';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Event, TicketTier]),
    CacheModule.registerAsync({
      useFactory: async () => ({
        stores: [
          new Keyv({
            store: new KeyvCacheableMemory({ ttl: 60000, lruSize: 5000 }),
          }),
          new Keyv({
            store: new KeyvRedis('redis://localhost:6379'),
            ttl: 60000,
          }),
        ],
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
