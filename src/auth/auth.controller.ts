import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { userDto } from 'src/dtos/user.dto';
import { JwtAuthGuard } from './JwtAuthGuard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authServ: AuthService,
    private readonly tokenServ: RefreshTokenService,
  ) {}

  @Post('registration')
  async registration(@Body() dto: userDto, @Res({ passthrough: true }) res) {
    const userData = await this.authServ.registration(dto);
    res.cookie('refreshToken', userData.refreshToken, {
      maxAge: 20 * 24 * 60 * 60 * 1000, // 20 days
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return userData;
  }

  @Post('login')
  async login(@Body() dto: userDto) {
    return await this.authServ.login(dto);
  }

  @Post('verify-code')
  async verifyCode(
    @Body() body: { email: string; code: string },
    @Res({ passthrough: true }) res,
  ) {
    const userData = await this.authServ.verifyCode(body.email, body.code);
    res.cookie('refreshToken', userData.refreshToken, {
      maxAge: 20 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return userData;
  }

  @Post('logOut')
  @UseGuards(JwtAuthGuard)
  async logOut(@Req() req, @Res({ passthrough: true }) res) {
    const userId = req.user.id;
    res.clearCookie('refreshToken');
    return await this.authServ.logOut(userId);
  }

  @Post('refreshingToken')
  async refreshing(@Res({ passthrough: true }) res, @Req() req) {
    const { refreshToken } = req.cookies;
    const token = await this.tokenServ.refreshingTokens(refreshToken);
    res.cookie('refreshToken', token.refreshToken, {
      maxAge: 20 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return token;
  }
}
