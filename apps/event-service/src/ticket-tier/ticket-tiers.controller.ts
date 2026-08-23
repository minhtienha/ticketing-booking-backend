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
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  CreateTicketTierDto,
  UpdateTicketTierDto,
  UserRole,
} from '@ticketing/entities';
import { TicketTiersService } from './ticket-tiers.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard, Roles, RolesGuard } from '@ticketing/common';

@Controller('ticket-tiers')
export class TicketTiersController {
  constructor(private readonly ticketTiersService: TicketTiersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTicketTierDto) {
    return await this.ticketTiersService.create(dto);
  }

  @CacheTTL(30000)
  @UseInterceptors(CacheInterceptor)
  @Get('event/:eventId')
  async findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return await this.ticketTiersService.findByEventId(eventId);
  }

  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.ticketTiersService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketTierDto,
  ) {
    return await this.ticketTiersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketTiersService.remove(id);
  }
}
