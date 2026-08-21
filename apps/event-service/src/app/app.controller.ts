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
import { AppService } from './app.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('events')
@UseInterceptors(CacheInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

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
    return await this.appService.getAllEvents(query);
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.appService.getEventById(id);
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
    return await this.appService.createEvent(data);
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
    return await this.appService.updateEvent(id, data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.appService.deleteEvent(id);
  }
}
