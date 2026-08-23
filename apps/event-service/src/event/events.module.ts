import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event, TicketTier } from '@ticketing/entities';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Event, TicketTier])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
