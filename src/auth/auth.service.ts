import { HttpException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ValidationService } from 'src/common/validation.service';
import { PrismaService } from 'src/common/prisma.service';
import { AuthValidation } from 'src/auth/auth.validation';
import { IRequestLoginUser, IRequestRegisterUser, IResponseRegisterAndLogin } from 'src/types/user.type';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private validationService: ValidationService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {}

  async createAccessToken(payload: { id: number; email: string }) {
    return await this.jwtService.signAsync(payload);
  }

  async verifyAccessToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<{ id: number; email: string }>(token);
    } catch (error) {
      throw new HttpException(error || 'Invalid or expired token', 401);
    }
  }

  async getUserProfile(id: number) {
    this.logger.info(`Get user profile ${id}`);
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) throw new HttpException('User not found', 404);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async register(request: IRequestRegisterUser): Promise<IResponseRegisterAndLogin> {
    this.logger.info(`Register new user ${JSON.stringify(request)}`);
    const registerRequest = this.validationService.validate(AuthValidation.REGISTER, request);

    const isRegistered = await this.prismaService.user.findUnique({ where: { email: registerRequest.email } });
    if (isRegistered) throw new HttpException('Email already registered, please login', 400);

    const newUser = await this.prismaService.user.create({
      data: {
        ...registerRequest,
        password: await bcrypt.hash(registerRequest.password, 10),
      },
    });

    return {
      message: 'Register success, welcome',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        updatedAt: newUser.updatedAt,
        createdAt: newUser.createdAt,
      },
      access_token: await this.createAccessToken({ id: newUser.id, email: newUser.email }),
    };
  }

  async login(request: IRequestLoginUser): Promise<IResponseRegisterAndLogin> {
    this.logger.info(`Login user ${JSON.stringify(request)}`);
    const loginRequest = this.validationService.validate(AuthValidation.LOGIN, request);

    const user = await this.prismaService.user.findUnique({ where: { email: loginRequest.email } });
    if (!user) throw new HttpException('User not found, please register first', 404);

    const isValid = await bcrypt.compare(loginRequest.password, user.password);
    if (!isValid) throw new HttpException('Invalid password', 400);

    return {
      message: 'Login success, welcome back',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
      },
      access_token: await this.createAccessToken({ id: user.id, email: user.email }),
    };
  }
}
