import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { TicketService } from '../ticket/ticket.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import {
  Order,
  OrderItem,
  PaymentStatus,
  TicketStatus,
} from '@ticketing/entities';

describe('OrderService (Unit Test)', () => {
  let service: OrderService;
  let mockOrderRepo: any;
  let mockOrderItemRepo: any;
  let mockTicketService: any;
  let mockOrderClient: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockOrderRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockOrderItemRepo = {};
    mockTicketService = {
      createTickets: jest.fn(),
    };
    mockOrderClient = {
      emit: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
        { provide: TicketService, useValue: mockTicketService },
        { provide: 'RESERVATION_SERVICE_CLIENT', useValue: mockOrderClient },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('createOrder - Idempotency', () => {
    it('nên ném ConflictException nếu bị trùng idempotencyKey (mã lỗi 23505)', async () => {
      mockDataSource.transaction.mockRejectedValue({ code: '23505' });

      await expect(
        service.createOrder({
          userId: 'user-1',
          reservationId: 'res-1',
          totalAmount: 100000,
          idempotencyKey: 'duplicate-key',
          ticketTierId: 'tier-1',
          quantity: 1,
          unitPrice: 100000,
          totalPrice: 100000,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateOrderStatus', () => {
    it('nên bỏ qua và không emit event nếu order đã ở trạng thái đó (Idempotent)', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'ord-1',
        paymentStatus: PaymentStatus.SUCCESS,
      });

      const res = await service.updateOrderStatus(
        'ord-1',
        PaymentStatus.SUCCESS,
      );

      expect(res?.paymentStatus).toBe(PaymentStatus.SUCCESS);
      expect(mockTicketService.createTickets).not.toHaveBeenCalled();
      expect(mockOrderClient.emit).not.toHaveBeenCalled();
    });

    it('khi trạng thái là SUCCESS, nên xuất vé và emit event order.payment_success', async () => {
      const existingOrder = {
        id: 'ord-1',
        reservationId: 'res-1',
        paymentStatus: PaymentStatus.PENDING,
      };
      mockOrderRepo.findOne.mockResolvedValue(existingOrder);
      mockOrderRepo.save.mockImplementation(async (order: any) => order);

      await service.updateOrderStatus('ord-1', PaymentStatus.SUCCESS);

      expect(mockTicketService.createTickets).toHaveBeenCalledWith({
        orderId: 'ord-1',
        status: TicketStatus.VALID,
      });
      expect(mockOrderClient.emit).toHaveBeenCalledWith(
        'order.payment_success',
        {
          reservationId: 'res-1',
        },
      );
    });

    it('nên tạo Order (PENDING) và OrderItem thành công khi dữ liệu hợp lệ', async () => {
      const mockOrder = { id: 'ord-123', paymentStatus: PaymentStatus.PENDING };
      const mockOrderItem = { id: 'item-123' };

      mockDataSource.transaction.mockImplementation(async (callback: any) => {
        const mockManager = {
          create: jest
            .fn()
            .mockReturnValueOnce(mockOrder)
            .mockReturnValueOnce(mockOrderItem),
          save: jest.fn().mockResolvedValue(mockOrder),
        };
        return await callback(mockManager);
      });

      const result = await service.createOrder({
        userId: 'user-1',
        reservationId: 'res-1',
        totalAmount: 200000,
        idempotencyKey: 'new-key',
        ticketTierId: 'tier-1',
        quantity: 2,
        unitPrice: 100000,
        totalPrice: 200000,
      });

      expect(result).toEqual(mockOrder);
    });

    it('nên trả về null nếu không tìm thấy Order để cập nhật trạng thái', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      const result = await service.updateOrderStatus(
        'non-exist-id',
        PaymentStatus.SUCCESS,
      );

      expect(result).toBeNull();
      expect(mockOrderClient.emit).not.toHaveBeenCalled();
    });

    it('khi trạng thái là FAILED, nên cập nhật đơn và emit event order.payment_failed', async () => {
      const existingOrder = {
        id: 'ord-1',
        reservationId: 'res-1',
        paymentStatus: PaymentStatus.PENDING,
      };
      mockOrderRepo.findOne.mockResolvedValue(existingOrder);
      mockOrderRepo.save.mockImplementation(async (order: any) => order);

      await service.updateOrderStatus('ord-1', PaymentStatus.FAILED);

      expect(mockOrderClient.emit).toHaveBeenCalledWith(
        'order.payment_failed',
        {
          reservationId: 'res-1',
        },
      );
      expect(mockTicketService.createTickets).not.toHaveBeenCalled();
    });
  });
});
