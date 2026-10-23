import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Reservation,
  TicketTier,
  ReservationStatus,
} from '@ticketing/entities';
import { CreateReservationCommandSchema } from '@ticketing/entities';

describe('ReservationService (Unit Test)', () => {
  let service: ReservationService;
  let mockTicketTierRepo: any;
  let mockReservationRepo: any;
  let mockOrderClient: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockTicketTierRepo = {
      findOne: jest.fn(),
    };
    mockReservationRepo = {
      findOne: jest.fn(),
    };
    mockOrderClient = {
      emit: jest.fn().mockReturnValue({ toPromise: () => Promise.resolve() }),
    };

    mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: 'ORDER_SERVICE_CLIENT', useValue: mockOrderClient },
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationRepo,
        },
        {
          provide: getRepositoryToken(TicketTier),
          useValue: mockTicketTierRepo,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
  });

  describe('makeReservation', () => {
    const makeDto = {
      ticketTierId: 'tier-123',
      userId: 'user-123',
      quantity: 2,
    };
    it('nên ném BadRequestException nếu hạng vé không tồn tại', async () => {
      mockTicketTierRepo.findOne.mockResolvedValue(null);
      await expect(service.makeReservation(makeDto)).rejects.toThrow(
        new BadRequestException('Hạng vé không tồn tại'),
      );
    });
    it('nên ném BadRequestException nếu hết vé hoặc không đủ số lượng', async () => {
      mockTicketTierRepo.findOne.mockResolvedValue({
        id: 'tier-123',
        price: 100000,
      });
      mockDataSource.transaction.mockImplementation(async (callback: any) => {
        const mockManager = {
          createQueryBuilder: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 0 }),
          }),
        };
        return await callback(mockManager);
      });
      await expect(service.makeReservation(makeDto)).rejects.toThrow(
        new BadRequestException(
          'Hạng vé đã hết hoặc không đủ số lượng yêu cầu',
        ),
      );
    });
    it('nên tạo Reservation PENDING và emit event reservation.created thành công', async () => {
      const mockTier = { id: 'tier-123', price: 100000 };
      const mockSavedRes = {
        id: 'res-456',
        userId: 'user-123',
        ticketTierId: 'tier-123',
        quantity: 2,
        status: ReservationStatus.PENDING,
      };
      mockTicketTierRepo.findOne.mockResolvedValue(mockTier);
      mockDataSource.transaction.mockImplementation(async (callback: any) => {
        const mockManager = {
          createQueryBuilder: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 1 }),
          }),
          create: jest.fn().mockReturnValue(mockSavedRes),
          save: jest.fn().mockResolvedValue(mockSavedRes),
        };
        return await callback(mockManager);
      });
      const result = await service.makeReservation(makeDto);
      expect(result).toEqual(mockSavedRes);
      expect(mockOrderClient.emit).toHaveBeenCalledWith(
        'reservation.created',
        expect.objectContaining({
          userId: 'user-123',
          reservationId: 'res-456',
          totalAmount: 200000,
        }),
      );
    });
  });

  describe('confirmReservation', () => {
    it('nên ném NotFoundException nếu không tìm thấy Reservation', async () => {
      mockDataSource.transaction.mockImplementation(async (callback: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return await callback(mockManager);
      });

      await expect(
        service.confirmReservation('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên giữ nguyên và trả về nếu Reservation đã CONFIRMED từ trước (Idempotent)', async () => {
      const existingRes = { id: 'res-1', status: ReservationStatus.CONFIRMED };

      mockDataSource.transaction.mockImplementation(async (callback: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(existingRes),
          save: jest.fn(),
        };
        return await callback(mockManager);
      });

      const result = await service.confirmReservation('res-1');

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });
  });

  describe('cancelReservation', () => {
    it('nên ném BadRequestException nếu đơn không ở trạng thái PENDING để hủy', async () => {
      mockDataSource.transaction.mockImplementation(async (callback: any) => {
        const mockManager = {
          createQueryBuilder: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 0 }), // 0 bản ghi được update
          }),
        };
        return await callback(mockManager);
      });

      await expect(
        service.cancelReservation('res-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('nên đổi trạng thái sang CANCELLED và hoàn lại số lượng vé vào TicketTier', async () => {
      const mockRes = { id: 'res-1', ticketTierId: 'tier-1', quantity: 3 };

      mockDataSource.transaction.mockImplementation(async (callback: any) => {
        const updateTicketTierBuilder = {
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        };

        const mockManager = {
          createQueryBuilder: jest
            .fn()
            .mockReturnValueOnce({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 1 }),
            })
            .mockReturnValueOnce(updateTicketTierBuilder),
          findOne: jest.fn().mockResolvedValue(mockRes),
        };
        return await callback(mockManager);
      });

      await expect(
        service.cancelReservation('res-1', 'user-1'),
      ).resolves.not.toThrow();
    });
  });

  it('nếu emit event gặp lỗi thì hàm phải throw lỗi ra ngoài', async () => {
    const makeDto = {
      ticketTierId: 'tier-1',
      userId: 'user-1',
      quantity: 1,
    };

    mockTicketTierRepo.findOne.mockResolvedValue({
      id: 'tier-1',
      price: 100000,
    });
    mockDataSource.transaction.mockResolvedValue({
      id: 'res-1',
      userId: 'user-1',
      ticketTierId: 'tier-1',
      quantity: 1,
    });

    // Giả lập RabbitMQ ném lỗi
    mockOrderClient.emit.mockImplementation(() => {
      throw new Error('RabbitMQ connection lost');
    });

    await expect(service.makeReservation(makeDto)).rejects.toThrow(
      'RabbitMQ connection lost',
    );
  });

  it('phải reject nếu quantity <= 0', () => {
    const result = CreateReservationCommandSchema.safeParse({
      ticketTierId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });
});
