import { Module } from '@nestjs/common';
import { CommonModule } from '@ticketing/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket, OrderItem, TicketTier } from '@ticketing/entities';
import { TicketService } from './ticket.service';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Ticket, OrderItem, TicketTier]),
  ],
  controllers: [],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
