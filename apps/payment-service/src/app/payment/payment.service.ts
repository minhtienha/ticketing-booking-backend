import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import {
  Payment,
  PaymentTransactionStatus,
  CreatePaymentIntentDto,
  VnPayQueryDto,
  Order,
  ReservationStatus,
} from '@ticketing/entities';
import { VNPay } from 'vnpay/vnpay';
import { HashAlgorithm, ProductCode, VnpLocale } from 'vnpay/enums';
import { VerifyIpnCall } from 'vnpay/types-only';
import { dateFormat, getDateInGMT7 } from 'vnpay/utils';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly vnpay: VNPay;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject('ORDER_SERVICE_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {
    this.vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE || '',
      secureSecret: process.env.VNPAY_SECURE_SECRET || '',
      vnpayHost: 'https://sandbox.vnpayment.vn',
      paymentEndpoint: 'paymentv2/vpcpay.html',
      testMode: true,
      hashAlgorithm: HashAlgorithm.SHA512,
      enableLog: true,
    });
  }

  async createPaymentIntent(
    data: CreatePaymentIntentDto,
    userId: string,
  ): Promise<{ paymentId: string; paymentUrl: string }> {
    if (data.idempotencyKey) {
      const existingPayment = await this.paymentRepository.findOne({
        where: { idempotencyKey: data.idempotencyKey },
      });

      if (existingPayment) {
        this.logger.log(
          `[Idempotency] Trả về URL cũ cho key: ${data.idempotencyKey}`,
        );
        return this.buildExistingVnpayUrl(existingPayment);
      }
    }

    const order = await this.orderRepository.findOne({
      where: {
        id: data.orderId,
        userId,
      },
      relations: {
        reservation: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về người dùng hiện tại.',
      );
    }

    if (!order.reservation) {
      throw new NotFoundException(
        'Không tìm thấy thông tin giữ vé của đơn hàng này.',
      );
    }

    if (order.reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        `Không thể tạo giao dịch thanh toán do phiên giữ vé đang ở trạng thái "${order.reservation.status}".`,
      );
    }

    const providerTxnId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const now = new Date();
    const createDate = dateFormat(getDateInGMT7(now));

    const expire = new Date(now.getTime() + 10 * 60 * 1000);
    const expireDate = dateFormat(getDateInGMT7(expire));

    const payment = this.paymentRepository.create({
      orderId: data.orderId,
      amount: data.amount,
      status: PaymentTransactionStatus.PENDING,
      idempotencyKey: data.idempotencyKey,
      providerTransactionId: providerTxnId,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    const paymentUrl = this.vnpay.buildPaymentUrl({
      vnp_Amount: Number(data.amount),
      vnp_IpAddr: '127.0.0.1',
      vnp_TxnRef: providerTxnId,
      vnp_OrderInfo: `Thanh toan don hang ${data.orderId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: 'http://localhost:3005/api/payments/vnpay-return',
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    });

    this.logger.log(`Tạo giao dịch thanh toán thành công: ${savedPayment.id}`);

    return {
      paymentId: savedPayment.id,
      paymentUrl: paymentUrl,
    };
  }

  private buildExistingVnpayUrl(existingPayment: any) {
    const existingPaymentUrl = this.vnpay.buildPaymentUrl({
      vnp_Amount: Number(existingPayment.amount),
      vnp_IpAddr: '127.0.0.1',
      vnp_TxnRef: existingPayment.providerTransactionId,
      vnp_OrderInfo: `Thanh toan don hang ${existingPayment.orderId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: 'http://localhost:3005/api/payments/vnpay-return',
      vnp_Locale: VnpLocale.VN,
    });

    return {
      paymentId: existingPayment.id,
      paymentUrl: existingPaymentUrl,
    };
  }

  async handleWebhook(
    query: VnPayQueryDto,
  ): Promise<{ RspCode: string; Message: string }> {
    const verify: VerifyIpnCall = this.vnpay.verifyIpnCall(query);

    if (!verify.isVerified) {
      this.logger.error('Xác thực webhook thất bại');
      throw new NotFoundException('Xác thực webhook thất bại');
    }

    const isSuccess = verify.isSuccess;
    const newStatus = isSuccess
      ? PaymentTransactionStatus.SUCCESS
      : PaymentTransactionStatus.FAILED;

    // 1. Chỉ update nếu status ĐANG LÀ PENDING
    const updateResult = await this.paymentRepository
      .createQueryBuilder()
      .update(Payment)
      .set({ status: newStatus })
      .where('providerTransactionId = :txnRef AND status = :pendingStatus', {
        txnRef: query.vnp_TxnRef,
        pendingStatus: PaymentTransactionStatus.PENDING,
      })
      .execute();

    // 2. Nếu affected === 0 => nghĩa là không có bản ghi nào hoặc đã được xử lý trước đó
    if (updateResult.affected === 0) {
      const existingPayment = await this.paymentRepository.findOne({
        where: { providerTransactionId: query.vnp_TxnRef },
      });

      if (!existingPayment) {
        this.logger.error('Không tìm thấy bản ghi giao dịch');
        throw new NotFoundException('Không tìm thấy bản ghi giao dịch');
      }

      this.logger.warn(
        `Giao dịch ${existingPayment.id} đã được xử lý trước đó.`,
      );
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    const payment = await this.paymentRepository.findOneOrFail({
      where: { providerTransactionId: query.vnp_TxnRef },
    });

    if (isSuccess) {
      this.rabbitClient.emit('payment.succeeded', {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
      });
      this.logger.log(`Thanh toán thành công đơn: ${payment.orderId}`);
    } else {
      this.rabbitClient.emit('payment.failed', {
        paymentId: payment.id,
        orderId: payment.orderId,
      });
      this.logger.log(`Thanh toán thất bại đơn: ${payment.orderId}`);
    }
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
