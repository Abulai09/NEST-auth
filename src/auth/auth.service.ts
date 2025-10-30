import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { userDto } from 'src/dtos/user.dto';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly refreshServ: RefreshTokenService,
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

    return this.generateAndSaveTokens(user);
  }

  async logOut(userId: number) {
    return await this.refreshServ.removeToken(userId);
  }
}
