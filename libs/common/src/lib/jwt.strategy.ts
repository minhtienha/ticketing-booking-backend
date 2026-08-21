import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User, UserStatus } from '@ticketing/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepository.findOneBy({ id: payload.sub });
    if (!user || !user.status || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'USER_INACTIVE',
        message: 'User is inactive',
      });
    }
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
