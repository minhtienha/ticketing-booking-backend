import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, CreateUserDto } from '@ticketing/entities';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}
  async create(data: CreateUserDto) {
    const existing = await this.usersRepository.findOneBy({
      email: data.email,
    });
    if (existing) {
      throw new HttpException('Email đã được sử dụng', HttpStatus.CONFLICT);
    }

    const hashedPassword = await this.hashPassword(data.password);
    const user = this.usersRepository.create({
      ...data,
      passwordHash: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    return savedUser;
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
