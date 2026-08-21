import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppGrpcController {
  constructor(private readonly appService: AppService) {}
  @GrpcMethod('UsersService', 'CreateUser')
  create(data: { email: string; password: string }) {
    console.log(data);
    return this.appService.create(data);
  }
}
