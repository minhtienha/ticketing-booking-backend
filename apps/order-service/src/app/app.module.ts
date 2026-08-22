import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from '@ticketing/common';
import { OrderModule } from './order/order.module';
import { TicketModule } from './ticket/ticket.module';
import {
  Order,
  OrderItem,
  Ticket,
  TicketTier,
  Event,
} from '@ticketing/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    CommonModule,
    OrderModule,
    TicketModule,
    TypeOrmModule.forFeature([Order, OrderItem, Ticket, TicketTier, Event]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
