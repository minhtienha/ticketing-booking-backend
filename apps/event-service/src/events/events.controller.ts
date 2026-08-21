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

@Controller('events')
@UseInterceptors(CacheInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    },
  ) {
    return await this.eventsService.getAllEvents(query);
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.eventsService.getEventById(id);
  }

  @Post()
  async create(
    @Body()
    data: {
      name: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      status?: string;
    },
  ) {
    return await this.eventsService.createEvent(data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      name: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      status?: string;
    },
  ) {
    return await this.eventsService.updateEvent(id, data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.eventsService.deleteEvent(id);
  }
}
