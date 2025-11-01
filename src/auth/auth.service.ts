import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { userDto } from 'src/dtos/user.dto';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginCode } from './entities/login-code.entity';
import { MailerService } from './nodemailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(LoginCode) private codeRepo: Repository<LoginCode>,
    private readonly refreshServ: RefreshTokenService,
    private readonly mailServ: MailerService,
  ) {}

  async generateAndSaveTokens(user: any) {
    const tokens = this.refreshServ.generateWebToken(user);
    await this.refreshServ.saveToken(tokens.refreshToken, user.id);
    return tokens;
  }

  async registration(dto: userDto) {
    const candidate = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['refreshTokens'],
    });
    if (candidate)
      throw new BadGatewayException(
        'Bad request,user with this email already exists',
      );

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ email: dto.email, password: hashed });
    await this.userRepo.save(user);

    return this.generateAndSaveTokens(user);
  }

  async login(dto: userDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['refreshTokens'],
    });
    if (!user) throw new NotFoundException('Not found');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new BadRequestException('Password not valid');

    // ✅ Генерация 6-значного кода
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const loginCode = await this.codeRepo.create({
      email: user.email,
      code,
      expiresAt,
    });
    await this.codeRepo.save(loginCode);

    await this.mailServ.sendCode(user.email, code);

    return { message: 'Verification code sent to your email' };
  }

  async verifyCode(email: string, code: string) {
    const record = await this.codeRepo.findOne({ where: { email, code } });
    if (!record) throw new UnauthorizedException('Invalid code');

    if (record.expiresAt < new Date()) {
      await this.codeRepo.delete({ id: record.id });
      throw new UnauthorizedException('Code expired');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    await this.codeRepo.delete({ id: record.id });

    user.sessionVersion += 1;
    await this.userRepo.save(user);

    const payload = {
      id: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion,
    };
    return this.generateAndSaveTokens(payload);
  }

  async logOut(userId: number) {
    return await this.refreshServ.removeToken(userId);
  }
}
