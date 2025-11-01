import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './refresh-token.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshTokenService {
  constructor(
    private jwtServ: JwtService,
    @InjectRepository(RefreshToken)
    private refreshRep: Repository<RefreshToken>,
    @InjectRepository(User)
    private userRep: Repository<User>,
  ) {}

  generateWebToken(payload: any) {
    console.log(payload);
    const access_token = this.jwtServ.sign(
      {
        id: payload.id,
        email: payload.email,
        sessionVersion: payload.sessionVersion,
      },
      { expiresIn: '24h' },
    );
    const refreshToken = this.jwtServ.sign(
      {
        id: payload.id,
        email: payload.email,
        sessionVersion: payload.sessionVersion,
      },
      { expiresIn: '20d' },
    );
    return { access_token, refreshToken };
  }

  async saveToken(refreshToken: string, userId: number) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 20);

    const existing = await this.refreshRep.findOne({ where: { userId } });

    if (existing) {
      existing.tokenHash = hashed;
      existing.expiresAt = expiresAt;
      existing.revoked = false;
      return await this.refreshRep.save(existing);
    }
    const user = await this.userRep.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const newToken = this.refreshRep.create({
      tokenHash: hashed,
      user,
      userId,
      expiresAt,
    });
    return this.refreshRep.save(newToken);
  }

  validateToken(refreshToken: string): string {
    const verified = this.jwtServ.verify(refreshToken);
    return verified;
  }

  async removeToken(userId: number) {
    const token = await this.refreshRep.findOne({ where: { userId } });
    if (!token) throw new UnauthorizedException('Unauthorized');
    token.revoked = true;
    await this.refreshRep.save(token);
    return { message: 'Refresh token revoked' };
  }

  async findToken(userId: number) {
    return await this.refreshRep.findOne({ where: { userId } });
  }

  async refreshingTokens(oldRefreshToken: string) {
    // Проверяем подпись refresh-токена
    const payload = this.jwtServ.verify(oldRefreshToken);
    const { id: userId } = payload;

    // Проверяем, что токен реально сохранён в БД
    const savedToken = await this.findToken(userId);
    if (!savedToken || savedToken.revoked)
      throw new UnauthorizedException('Token revoked or not found');

    // Сравниваем хэш refresh-токена с переданным
    const isMatch = await bcrypt.compare(oldRefreshToken, savedToken.tokenHash);
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token');

    // ✅ ВАЖНО: достаём пользователя, чтобы передать email
    const user = await this.userRep.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // ✅ Передаём id и email, чтобы access_token был корректным
    const newTokens = this.generateWebToken({ id: user.id, email: user.email });

    // ✅ Сохраняем новый refresh-токен и ревокуем старый
    await this.saveToken(newTokens.refreshToken, userId);
    savedToken.revoked = true;
    await this.refreshRep.save(savedToken);

    return newTokens;
  }
}
