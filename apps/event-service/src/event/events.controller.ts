import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  CreateEventDto,
  UpdateEventDto,
  ListEventsQueryDto,
  UserRole,
} from '@ticketing/entities';
import { JwtAuthGuard, Roles, RolesGuard } from '@ticketing/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseInterceptors(CacheInterceptor)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sự kiện (kèm phân trang và bộ lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm theo tên sự kiện',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
    description: 'Lọc theo trạng thái sự kiện (DRAFT, PUBLISHED, CANCELLED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách sự kiện kèm tổng số trang.',
  })
  async getAll(@Query() query: ListEventsQueryDto) {
    return await this.eventsService.getAllEvents(query);
  }

  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một sự kiện theo ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID của sự kiện' })
  @ApiResponse({
    status: 200,
    description: 'Trả về chi tiết sự kiện và các hạng vé liên quan.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sự kiện.',
  })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.eventsService.getEventById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo sự kiện mới (Organizer / Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Tạo sự kiện thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực quyền truy cập.',
  })
  async create(@Body() data: CreateEventDto) {
    return await this.eventsService.createEvent(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật thông tin sự kiện' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID sự kiện cần sửa' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật sự kiện thành công.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực quyền truy cập.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sự kiện để cập nhật.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateEventDto,
  ) {
    return await this.eventsService.updateEvent(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa sự kiện' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID sự kiện cần xóa' })
  @ApiResponse({
    status: 200,
    description: 'Xóa sự kiện thành công.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực quyền truy cập.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sự kiện.',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.eventsService.deleteEvent(id);
  }
}
