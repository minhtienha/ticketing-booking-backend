import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}
  @GrpcMethod('UsersService', 'CreateUser')
  create(data: { email: string; password: string }) {
    console.log(data);
    return this.usersService.create(data);
  }
}
