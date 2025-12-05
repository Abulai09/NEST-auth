import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './token.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly jwtServ: JwtService,
  ) {}

  generateWebToken(payload: any) {
    console.log(payload);
    const userData = {
      id: payload.id,
      sessionVersion: payload.sessionVersion,
      username: payload.username,
    };

    const access_token = this.jwtServ.sign(userData, { expiresIn: '10m' });
    const refresh_token = this.jwtServ.sign(userData, {
      secret: process.env.JWT_REFRESH,
      expiresIn: '20m',
    });

    return { access_token, refresh_token };
  }

  async saveToken(refreshToken: string, userId: number) {
    try {
      const hashed = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

      const existing = await this.tokenRepo.findOne({ where: { userId } });
      if (existing) {
        existing.hashedToken = hashed;
        existing.expiresAt = expiresAt;
        existing.revoked = false;
        return await this.tokenRepo.save(existing);
      }

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new BadRequestException('User not found');

      const newToken = this.tokenRepo.create({
        hashedToken: hashed,
        expiresAt,
        user,
        userId,
      });
      return await this.tokenRepo.save(newToken);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async removeToken(userId: number) {
    try {
      const refreshToken = await this.tokenRepo.findOne({ where: { userId } });
      if (!refreshToken) throw new UnauthorizedException('Unauthorized');
      refreshToken.revoked = true;
      await this.tokenRepo.save(refreshToken);
      return { message: 'logged Out' };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async refreshingTokens(refreshToken: string) {
    const payload = this.jwtServ.verify(refreshToken, {
      secret: process.env.JWT_REFRESH,
    });
    const { id: userId } = payload;

    const savedInDb = await this.tokenRepo.findOne({ where: { userId } });
    if (!savedInDb || savedInDb.revoked)
      throw new UnauthorizedException('Token revoked or not found');

    const isMatch = await bcrypt.compare(refreshToken, savedInDb.hashedToken);
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    savedInDb.revoked = true;
    await this.tokenRepo.save(savedInDb);

    const newTokens = this.generateWebToken({
      id: user.id,
      username: user.username,
      sessionVersion: user.sessionVersion,
    });
    await this.saveToken(newTokens.refresh_token, userId);

    return newTokens;
  }
}
