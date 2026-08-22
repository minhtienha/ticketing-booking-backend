import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  User,
  Auth,
  UserStatus,
  LoginAuthDto,
  RegisterAuthDto,
} from '@ticketing/entities';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Auth) private authRepository: Repository<Auth>,
    private jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(data: RegisterAuthDto) {
    return await this.usersService.create(data);
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async login(data: LoginAuthDto) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: data.email })
      .getOne();

    console.log(user);

    if (!user || !user.status || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc đã bị khóa',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return await this.generateTokens(user.id, user.email);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const auth = this.authRepository.create({
      token: refreshTokenHash,
      user: {
        id: userId,
      },
      expiresAt,
    });

    await this.authRepository.save(auth);

    return {
      accessToken,
      accessTokenExpires: Math.floor(Date.now() / 1000) + 900,
      refreshToken,
      refreshTokenExpires: Math.floor(Date.now() / 1000) + 2592000,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async refreshToken(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);

    const auth = await this.authRepository.findOneBy({
      token: refreshTokenHash,
    });
    if (!auth || auth.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    const user = await this.usersRepository.findOneBy({ id: auth.id });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Người dùng không tồn tại hoặc đã bị khóa',
      );
    }

    return this.generateTokens(user.id, user.email);
  }

  async logout(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.authRepository.delete({ token: refreshTokenHash });
    return { message: 'Đăng xuất thành công' };
  }
}
