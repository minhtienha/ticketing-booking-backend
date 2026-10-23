import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  Payment,
  Order,
  ReservationStatus,
  PaymentTransactionStatus,
} from '@ticketing/entities';

describe('PaymentService (Unit Test)', () => {
  let service: PaymentService;
  let mockPaymentRepo: any;
  let mockOrderRepo: any;
  let mockRabbitClient: any;

  beforeEach(async () => {
    mockPaymentRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    mockOrderRepo = {
      findOne: jest.fn(),
    };
    mockRabbitClient = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: 'ORDER_SERVICE_CLIENT', useValue: mockRabbitClient },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('createPaymentIntent', () => {
    const dto = {
      orderId: 'order-1',
      amount: 200000,
      idempotencyKey: 'idem-key-1',
    };

    it('nên ném NotFoundException nếu Order không tồn tại hoặc không thuộc về User', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.createPaymentIntent(dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('nên ném BadRequestException nếu Reservation không ở trạng thái PENDING', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockOrderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        reservation: { status: ReservationStatus.EXPIRED },
      });

      await expect(service.createPaymentIntent(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('nên trả về link thanh toán cũ nếu idempotencyKey đã tồn tại', async () => {
      const existingPayment = {
        id: 'pay-existing',
        amount: 200000,
        providerTransactionId: 'TXN_OLD_123',
        orderId: 'order-1',
      };
      mockPaymentRepo.findOne.mockResolvedValue(existingPayment);

      const result = await service.createPaymentIntent(dto, 'user-1');

      expect(result.paymentId).toBe('pay-existing');
      expect(result.paymentUrl).toBeDefined();
      expect(mockOrderRepo.findOne).not.toHaveBeenCalled(); // Không cần query lại Order
    });

    it('nên tạo bản ghi Payment PENDING và trả về URL VNPay thành công', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null); // Chưa có idempotencyKey
      mockOrderRepo.findOne.mockResolvedValue({
        id: dto.orderId,
        userId: 'user-1',
        reservation: { status: ReservationStatus.PENDING },
      });

      const savedPayment = {
        id: 'pay-new-123',
        ...dto,
        status: PaymentTransactionStatus.PENDING,
      };
      mockPaymentRepo.create.mockReturnValue(savedPayment);
      mockPaymentRepo.save.mockResolvedValue(savedPayment);

      const result = await service.createPaymentIntent(dto, 'user-1');

      expect(result.paymentId).toBe('pay-new-123');
      expect(result.paymentUrl).toContain('https://sandbox.vnpayment.vn');
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });
  });
});
