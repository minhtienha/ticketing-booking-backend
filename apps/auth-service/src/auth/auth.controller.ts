import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  LoginAuthDto,
  RegisterAuthDto,
  RefreshTokenDto,
} from '@ticketing/entities';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đăng nhập người dùng' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập thành công, trả về Access Token và Refresh Token.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Dữ liệu đầu vào không hợp lệ (sai định dạng email, thiếu password).',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Email hoặc mật khẩu không chính xác.',
  })
  login(@Body() data: LoginAuthDto) {
    return this.authService.login(data);
  }

  @Post('/register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Đăng ký tài khoản thành công.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email đã tồn tại trong hệ thống.',
  })
  register(@Body() data: RegisterAuthDto) {
    return this.authService.register(data);
  }

  @Post('/refresh-token')
  @ApiOperation({ summary: 'Làm mới Access Token' })
  @ApiResponse({ status: 200, description: 'Cấp lại token mới thành công' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
  })
  refreshToken(@Body() data: RefreshTokenDto) {
    return this.authService.refreshToken(data.refreshToken);
  }
}
