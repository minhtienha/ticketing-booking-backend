import {
  Controller,
  Post,
  Param,
  Body,
  Logger,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  CreateReservationDto,
  ReservationEventDto,
  User,
} from '@ticketing/entities';
import { CurrentUser, JwtAuthGuard } from '@ticketing/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('reservations')
export class ReservationController {
  private readonly logger = new Logger(ReservationController.name);
  constructor(private readonly reservationService: ReservationService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo yêu cầu đặt giữ vé (Reservation)',
    description:
      'Thực hiện giảm tồn kho nguyên tử (Atomic Conditional Update) và tạo bản ghi giữ vé có thời hạn (PENDING).',
  })
  @ApiResponse({
    status: 201,
    description: 'Giữ chỗ vé thành công, trả về thông tin reservation.',
  })
  @ApiResponse({
    status: 400,
    description: 'Hạng vé đã hết hoặc không đủ số lượng tồn kho khả dụng.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ.',
  })
  async makeReservation(
    @CurrentUser() user: User,
    @Body() data: CreateReservationDto,
  ) {
    return this.reservationService.makeReservation({
      ...data,
      userId: user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Người dùng chủ động hủy yêu cầu giữ vé',
    description:
      'Chuyển trạng thái reservation từ PENDING sang CANCELLED và hoàn lại số lượng vé khả dụng vào kho.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của Reservation cần hủy',
    example: 'res_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Hủy giữ vé thành công và hoàn trả số lượng vé vào kho.',
  })
  @ApiResponse({
    status: 400,
    description: 'Reservation không ở trạng thái PENDING hoặc không thể hủy.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Reservation.',
  })
  async cancelReservation(
    @Param('id', ParseUUIDPipe) reservationId: string,
    @CurrentUser() user: User,
  ) {
    return this.reservationService.cancelReservation(reservationId, user.id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xác nhận đặt vé sau khi thanh toán thành công',
    description:
      'Chuyển trạng thái reservation từ PENDING sang CONFIRMED để chuyển tiếp sang tạo vé chính thức.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của Reservation cần xác nhận',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác nhận reservation thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Reservation không ở trạng thái PENDING.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Reservation.',
  })
  confirmReservation(@Param('id') id: string) {
    return this.reservationService.confirmReservation(id);
  }

  @EventPattern('order.payment_success')
  async handleOrderSuccess(@Payload() data: ReservationEventDto) {
    this.logger.log(
      `Nhận tín hiệu thanh toán thành công cho giữ chỗ: ${data.reservationId}`,
    );

    await this.reservationService.confirmReservation(data.reservationId);
  }

  @EventPattern('order.payment_failed')
  async handleOrderFailed(@Payload() data: ReservationEventDto) {
    this.logger.log(
      `Nhận tín hiệu thanh toán thất bại. Tiến hành hủy giữ chỗ: ${data.reservationId}`,
    );

    await this.reservationService.cancelReservationInternal(data.reservationId);
  }
}
