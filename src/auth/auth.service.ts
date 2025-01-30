import { HttpException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ValidationService } from 'src/common/validation.service';
import { UserService } from 'src/user/user.service';
import { UserValidation } from 'src/user/user.validation';
import { ILoginUserRequest, IRegisterUserRequest } from 'src/types/user.type';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private validationService: ValidationService,
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {}

  async createAccessToken(payload: object) {
    return await this.jwtService.signAsync(payload);
  }

  async verifyAccessToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new HttpException('Invalid or expired token', 401);
    }
  }

  async register(request: IRegisterUserRequest) {
    this.logger.info(`Register new user ${JSON.stringify(request)}`);
    const registerRequest = this.validationService.validate(UserValidation.REGISTER, request);

    const isRegistered = await this.userService.getUserByEmail(registerRequest.email);
    if (isRegistered) throw new HttpException('Email already registered, please login', 400);

    const user = await this.userService.createUser(registerRequest);
    if (!user) throw new HttpException('Register failed', 400);

    return {
      message: 'Register success, welcome',
      user: user,
      access_token: await this.createAccessToken({ id: user.id, email: user.email }),
    };
  }

  async login(request: ILoginUserRequest) {
    this.logger.info(`Login user ${JSON.stringify(request)}`);
    const loginRequest = this.validationService.validate(UserValidation.LOGIN, request);

    const user = await this.userService.getUserByEmail(loginRequest.email);
    if (!user) throw new HttpException('User not found, please register first', 404);

    const isValid = await bcrypt.compare(loginRequest.password, user.password);
    if (!isValid) throw new HttpException('Invalid password', 400);

    return {
      message: 'Login success, welcome back',
      user: user,
      access_token: await this.createAccessToken({ id: user.id, email: user.email }),
    };
  }
}
