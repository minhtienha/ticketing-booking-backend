import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  CreateTicketTierDto,
  UpdateTicketTierDto,
  UserRole,
} from '@ticketing/entities';
import { TicketTiersService } from './ticket-tiers.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard, Roles, RolesGuard } from '@ticketing/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('ticket-tiers')
export class TicketTiersController {
  constructor(private readonly ticketTiersService: TicketTiersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo hạng vé mới cho sự kiện',
    description: 'Tạo hạng vé với số lượng phát hành và mức giá cố định.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo hạng vé thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc sự kiện không tồn tại.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực quyền truy cập.',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTicketTierDto) {
    return await this.ticketTiersService.create(dto);
  }

  @CacheTTL(30000)
  @UseInterceptors(CacheInterceptor)
  @Get('event/:eventId')
  @ApiOperation({
    summary: 'Lấy toàn bộ danh sách hạng vé theo Event ID',
    description:
      'Trả về các hạng vé khả dụng kèm số lượng còn lại cho khách hàng lựa chọn.',
  })
  @ApiParam({
    name: 'eventId',
    type: 'string',
    description: 'ID của sự kiện cần lấy danh sách hạng vé',
    example: 'evt_123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách hạng vé thành công.',
  })
  async findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return await this.ticketTiersService.findByEventId(eventId);
  }

  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một hạng vé theo ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của Ticket Tier',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết hạng vé.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hạng vé.',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.ticketTiersService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin hoặc số lượng hạng vé' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của Ticket Tier cần cập nhật',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật hạng vé thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể giảm tổng số lượng thấp hơn số vé đã được đặt/bán.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hạng vé.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketTierDto,
  ) {
    return await this.ticketTiersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa một hạng vé' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của Ticket Tier cần xóa',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa hạng vé thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Hạng vé đã có người đặt mua, không thể xóa.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hạng vé.',
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketTiersService.remove(id);
  }
}
