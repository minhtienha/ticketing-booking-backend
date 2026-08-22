import { Body, Controller, Post } from '@nestjs/common';
import { LoginAuthDto, RegisterAuthDto } from '@ticketing/entities';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(@Body() data: LoginAuthDto) {
    return this.authService.login(data);
  }

  @Post('/register')
  register(@Body() data: RegisterAuthDto) {
    return this.authService.register(data);
  }
}
