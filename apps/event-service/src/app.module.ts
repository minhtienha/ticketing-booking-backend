import { Module } from '@nestjs/common';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event, TicketTier } from '@ticketing/entities';
import { EventsModule } from './event/events.module';
import { TicketTiersModule } from './ticket-tier/ticket-tiers.module';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { KeyvCacheableMemory } from 'cacheable';

@Module({
  imports: [
    CommonModule,
    EventsModule,
    TicketTiersModule,
    TypeOrmModule.forFeature([Event, TicketTier]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new KeyvCacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis('redis://localhost:6379'),
          ],
        };
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
