import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreatePaymentIntentDto,
  User,
  VnPayQueryDto,
} from '@ticketing/entities';
import { PaymentService } from './payment.service';
import { CurrentUser, JwtAuthGuard } from '@ticketing/common';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentService.createPaymentIntent(dto, user.id);
  }

  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Query() query: VnPayQueryDto) {
    await this.paymentService.handleWebhook(query);
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  @Get('vnpay-return')
  async handleReturnUrl(@Query() query: VnPayQueryDto) {
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
