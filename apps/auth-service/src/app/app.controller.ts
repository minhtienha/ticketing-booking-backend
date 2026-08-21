import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/login')
  login(@Body() data: { email: string; password: string }) {
    return this.appService.login(data);
  }

  @Post('/register')
  register(@Body() data: any) {
    return this.appService.register(data);
  }
}
