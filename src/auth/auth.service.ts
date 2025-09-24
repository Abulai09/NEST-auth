import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { authDto } from './authDto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtServ: JwtService,
  ) {}

  generateWebToken(payload: any) {
    console.log(payload);
    return {
      access_token: this.jwtServ.sign(payload, {
        secret: process.env.JWT_SECRET || 'default',
      }),
    };
  }

  async registration(dto: authDto) {
    try {
      const candidate = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (candidate)
        throw new HttpException('This username already exist', 402);

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.userRepo.create({
        username: dto.username,
        password: hashedPassword,
      });
      await this.userRepo.save(user);
      return this.generateWebToken({ id: user.id, username: user.username });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async login(dto: authDto) {
    try {
      const user = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (!user) throw new NotFoundException('Invalid username or password :(');

      const validPassword = await bcrypt.compare(dto.password, user.password);
      if (!validPassword)
        throw new NotFoundException('Invalid username or password :(');

      return this.generateWebToken({ id: user.id, username: user.username });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async loginAdmin(dto: authDto) {
    try {
      const admin = process.env.ADMIN;
      const password = process.env.ADMIN_PASSWORD;

      if (dto.username !== admin || dto.password !== password)
        throw new NotFoundException('Invalid username or password :(');

      return this.generateWebToken({
        username: dto.username,
        role: 'admin',
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
