import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateUserDto } from '@ticketing/entities';
import { UsersService } from './users.service';

@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}
  @GrpcMethod('UsersService', 'CreateUser')
  create(data: CreateUserDto) {
    console.log(data);
    return this.usersService.create(data);
  }
}
