// import { Controller, Logger } from '@nestjs/common';
// import { TicketService } from './ticket.service';
// import { EventPattern, Payload } from '@nestjs/microservices';
// import { TicketStatus } from '@ticketing/entities';

// @Controller('tickets')
// export class TicketController {
//   private readonly logger = new Logger(TicketController.name);

//   constructor(private readonly ticketService: TicketService) {}

//   async handleOrderPaymentSuccess(@Payload() data: { orderId: string }) {
//     this.logger.log(`Nhận yêu cầu xuất vé cho đơn hàng: ${data.orderId}`);

//     await this.ticketService.createTickets({
//       orderId: data.orderId,
//       status: TicketStatus.VALID,
//     });
//   }
// }
