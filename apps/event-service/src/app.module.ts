import { Module } from '@nestjs/common';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event, TicketTier } from '@ticketing/entities';
import { EventsModule } from './events/events.module';
import { TicketTiersModule } from './ticket-tiers/ticket-tiers.module';

@Module({
  imports: [
    CommonModule,
    EventsModule,
    TicketTiersModule,
    TypeOrmModule.forFeature([Event, TicketTier]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
