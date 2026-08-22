import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  ListEventsQueryDto,
} from '@ticketing/entities';
import { Repository } from 'typeorm';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepository: Repository<Event>,
  ) {}

  async getAllEvents(query: ListEventsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const qb = this.eventRepository
      .createQueryBuilder('events')
      .orderBy('events.startTime', 'DESC')
      .addOrderBy('events.id', 'DESC');

    if (query.search?.trim()) {
      qb.andWhere('events.name ILIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }

    if (query.status) {
      qb.andWhere('events.status = :status', { status: query.status });
    }

    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // async getAllEvents(query: {
  //   page?: number;
  //   limit?: number;
  //   search?: string;
  //   status?: string;
  // }) {
  //   const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  //   const qb = this.eventRepository
  //     .createQueryBuilder('event')
  //     .orderBy('event.startTime', 'DESC')
  //     .addOrderBy('event.id', 'DESC')
  //     .take(limit + 1);

  //   if (query.cursor) {
  //     const decoded = JSON.parse(
  //       Buffer.from(query.cursor, 'base64').toString('utf8'),
  //     );
  //     qb.andWhere(
  //       '(event.startTime < :startTime OR (event.startTime = :startTime AND event.id < :id))',
  //       {
  //         startTime: new Date(decoded.startTime),
  //         id: decoded.id,
  //       },
  //     );
  //   }

  //   if (query.search) {
  //     qb.andWhere('event.name ILIKE :search', { search: `%${query.search}%` });
  //   }

  //   if (query.status) {
  //     qb.andWhere('event.status = :status', { status: query.status });
  //   }

  //   const items = await qb.getMany();

  //   const hasNextPage = items.length > limit;
  //   if (hasNextPage) {
  //     items.pop();
  //   }

  //   const lastItem = items[items.length - 1];
  //   let nextCursor: string | null = null;

  //   if (hasNextPage && lastItem) {
  //     const cursorObj = {
  //       startTime: lastItem.startTime.toISOString(),
  //       id: lastItem.id,
  //     };
  //     nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
  //   }

  //   return {
  //     data: items,
  //     meta: {
  //       limit,
  //       hasNextPage,
  //       nextCursor,
  //     },
  //   };
  // }

  async getEventById(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { ticketTiers: true },
    });
    if (!event) {
      throw new HttpException(
        'Không tìm thấy Event hợp lệ',
        HttpStatus.NOT_FOUND,
      );
    }
    return event;
  }

  async createEvent(data: CreateEventDto): Promise<Event> {
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new HttpException(
        'Thời gian kết thúc phải diễn ra sau thời gian bắt đầu',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newEvent = this.eventRepository.create(data);
    return await this.eventRepository.save(newEvent);
  }

  async updateEvent(id: string, data: UpdateEventDto): Promise<Event> {
    const event = await this.getEventById(id);

    const startTime = data.startTime
      ? new Date(data.startTime)
      : event.startTime;
    const endTime = data.endTime ? new Date(data.endTime) : event.endTime;

    if (startTime >= endTime) {
      throw new HttpException(
        'Thời gian kết thúc phải diễn ra sau thời gian bắt đầu',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedEvent = this.eventRepository.merge(event, data);
    return await this.eventRepository.save(updatedEvent);
  }

  async deleteEvent(id: string): Promise<{ message: string }> {
    await this.getEventById(id);

    await this.eventRepository.delete(id);

    return {
      message: `Xóa Event thành công với ID: ${id}`,
    };
  }
}
