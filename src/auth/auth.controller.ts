import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { UserEmailDto } from './dto/user-email.dto';
import { JwtTokens } from './types/jwtTokens';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registration')
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.registration(dto);
    this.setTokensToCookie(res, tokens);

    return user;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(dto);
    this.setTokensToCookie(res, tokens);

    return user;
  }

  @Post('logout')
  async logout(
    @Body() dto: UserEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log(req.cookies);
    // const refreshToken: string = req.cookies?.['refresh_token'] || 'null';
    // res.clearCookie('refresh_token');
    // res.clearCookie('access_token');

    // await this.authService.logout(dto, refreshToken);
    res.status(HttpStatus.OK);
    return [];
  }

  @Post('refresh')
  async refresh(
    @Body() dto: UserEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken: string = req.cookies?.['refresh_token'];

    const { user, tokens } = await this.authService.refresh(dto, refreshToken);
    this.setTokensToCookie(res, tokens);

    return user;
  }

  private setTokensToCookie(res: Response, tokens: JwtTokens) {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      maxAge: eval(process.env.JWT_ACCESS_COOKIE_TTL),
      secure: process.env.NODE_ENV === 'development',
      sameSite: 'strict',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: eval(process.env.JWT_REFRESH_COOKIE_TTL),
      secure: process.env.NODE_ENV === 'development',
      sameSite: 'strict',
      path: '/auth/',
    });
  }
}
