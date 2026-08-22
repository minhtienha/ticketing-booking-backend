import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketTier, Event } from '@ticketing/entities';

@Injectable()
export class TicketTiersService {
  constructor(
    @InjectRepository(TicketTier)
    private readonly ticketTierRepository: Repository<TicketTier>,

    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(dto: {
    eventId: string;
    name: string;
    price: number;
    totalQuantity: number;
  }): Promise<TicketTier> {
    const event = await this.eventRepository.findOne({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException(
        `Không tìm thấy sự kiện với ID: ${dto.eventId}`,
      );
    }

    const tier = this.ticketTierRepository.create({
      ...dto,
      availableQuantity: dto.totalQuantity,
    });

    return await this.ticketTierRepository.save(tier);
  }

  async findByEventId(eventId: string): Promise<TicketTier[]> {
    return await this.ticketTierRepository.find({
      where: { eventId },
      order: { price: 'ASC' },
    });
  }

  async findOne(id: string): Promise<TicketTier> {
    const tier = await this.ticketTierRepository.findOne({
      where: { id },
      relations: { event: true },
    });

    if (!tier) {
      throw new NotFoundException(`Không tìm thấy hạng vé với ID: ${id}`);
    }

    return tier;
  }

  async update(
    id: string,
    dto: {
      eventId?: string;
      name?: string;
      price?: number;
      totalQuantity?: number;
    },
  ): Promise<TicketTier> {
    const tier = await this.findOne(id);

    if (dto.totalQuantity !== undefined) {
      const soldQuantity = tier.totalQuantity - tier.availableQuantity;
      if (dto.totalQuantity < soldQuantity) {
        throw new BadRequestException(
          `Tổng số lượng vé không thể nhỏ hơn số vé đã bán (${soldQuantity} vé)`,
        );
      }
      tier.availableQuantity = dto.totalQuantity - soldQuantity;
      tier.totalQuantity = dto.totalQuantity;
    }

    if (dto.name) tier.name = dto.name;
    if (dto.price !== undefined) tier.price = dto.price;

    return await this.ticketTierRepository.save(tier);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const tier = await this.findOne(id);

    const soldQuantity = tier.totalQuantity - tier.availableQuantity;
    if (soldQuantity > 0) {
      throw new BadRequestException(
        `Không thể xóa hạng vé này vì đã có ${soldQuantity} vé được đặt/bán`,
      );
    }

    await this.ticketTierRepository.remove(tier);
    return { success: true, message: 'Đã xóa hạng vé thành công' };
  }

  async reserveTickets(tierId: string, quantity: number): Promise<boolean> {
    const result = await this.ticketTierRepository
      .createQueryBuilder()
      .update(TicketTier)
      .set({
        availableQuantity: () => `availableQuantity - ${quantity}`,
      })
      .where('id = :id AND availableQuantity >= :quantity', {
        id: tierId,
        quantity,
      })
      .execute();

    if (!result.affected || result.affected === 0) {
      throw new BadRequestException(
        'Hạng vé đã hết hoặc không đủ số lượng yêu cầu',
      );
    }

    return true;
  }
}
