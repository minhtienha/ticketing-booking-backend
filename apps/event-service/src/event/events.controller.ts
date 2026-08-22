import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  CreateEventDto,
  UpdateEventDto,
  ListEventsQueryDto,
} from '@ticketing/entities';

@Controller('events')
@UseInterceptors(CacheInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getAll(@Query() query: ListEventsQueryDto) {
    return await this.eventsService.getAllEvents(query);
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.eventsService.getEventById(id);
  }

  @Post()
  async create(@Body() data: CreateEventDto) {
    return await this.eventsService.createEvent(data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateEventDto,
  ) {
    return await this.eventsService.updateEvent(id, data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.eventsService.deleteEvent(id);
  }
}
