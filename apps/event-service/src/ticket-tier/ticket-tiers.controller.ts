import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketTiersService } from './ticket-tiers.service';

@Controller('ticket-tiers')
export class TicketTiersController {
  constructor(private readonly ticketTiersService: TicketTiersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    dto: {
      eventId: string;
      name: string;
      price: number;
      totalQuantity: number;
    },
  ) {
    return await this.ticketTiersService.create(dto);
  }

  @Get('event/:eventId')
  async findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return await this.ticketTiersService.findByEventId(eventId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.ticketTiersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    dto: {
      eventId?: string;
      name?: string;
      price?: number;
      totalQuantity?: number;
    },
  ) {
    return await this.ticketTiersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.ticketTiersService.remove(id);
  }
}
