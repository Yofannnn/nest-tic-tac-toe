import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { IRequestLoginUser, IRequestRegisterUser } from 'src/types/user.type';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() request: IRequestRegisterUser, @Res() response: Response) {
    const result = await this.authService.register(request);

    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return response.json({
      message: result.message,
      data: result.user,
    });
  }

  @Post('login')
  async login(@Body() request: IRequestLoginUser, @Res() response: Response) {
    const result = await this.authService.login(request);

    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return response.json({
      message: result.message,
      data: result.user,
    });
  }
}
