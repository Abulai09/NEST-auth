import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authDto } from './authDto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authServ: AuthService) {}

  @ApiOperation({ summary: 'Регестрация пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: { example: { access_token: 'token..' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации или пользователь уже существует',
  })
  @Post('registration')
  async registration(@Body() dto: authDto) {
    return await this.authServ.registration(dto);
  }

  @ApiOperation({ summary: 'логин пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: { example: { access_token: 'token..' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации или пользователь уже существует',
  })
  @Post('login')
  async login(@Body() dto: authDto) {
    return await this.authServ.login(dto);
  }

  @ApiOperation({ summary: 'логин админ' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: { example: { access_token: 'token..' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации или пользователь уже существует',
  })
  @Post('admin')
  async loginAdmin(@Body() dto: authDto) {
    return await this.authServ.loginAdmin(dto);
  }
}
