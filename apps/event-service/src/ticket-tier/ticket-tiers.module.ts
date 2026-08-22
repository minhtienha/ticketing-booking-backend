import { Module } from '@nestjs/common';
import { TicketTiersService } from './ticket-tiers.service';
import { TicketTiersController } from './ticket-tiers.controller';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketTier, Event } from '@ticketing/entities';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([TicketTier, Event])],
  controllers: [TicketTiersController],
  providers: [TicketTiersService],
})
export class TicketTiersModule {}
