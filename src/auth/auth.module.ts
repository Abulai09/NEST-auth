import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwtStrategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.entity';
import { RefreshToken } from 'src/refresh-token/refresh-token.entity';
import { RefreshTokenModule } from 'src/refresh-token/refresh-token.module';
import { LoginCode } from './entities/login-code.entity';
import { MailerService } from './nodemailer/mailer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, LoginCode]),
    PassportModule,
    RefreshTokenModule,
  ],
  providers: [AuthService, JwtStrategy, MailerService],
  controllers: [AuthController],
})
export class AuthModule {}
