import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  async createPaymentIntent(
    @Body()
    dto: {
      orderId: string;
      amount: number;
      idempotencyKey: string;
    },
  ) {
    return await this.paymentService.createPaymentIntent(dto);
  }

  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Query() query: any) {
    await this.paymentService.handleWebhook(query);
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  @Get('vnpay-return')
  async handleReturnUrl(@Query() query: any) {
    const isSuccess = query.vnp_ResponseCode === '00';

    return {
      message: isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại',
      orderId: query.vnp_OrderInfo,
      amount: Number(query.vnp_Amount) / 100,
      transactionNo: query.vnp_TransactionNo,
      bankCode: query.vnp_BankCode,
      payDate: query.vnp_PayDate,
    };
  }
}
