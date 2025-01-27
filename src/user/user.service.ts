import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ValidationService } from 'src/common/validation.service';
import { PrismaService } from 'src/common/prisma.service';
import { RegisterUserRequest } from 'src/model/user.model';
import { UserValidation } from './user.validation';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async register(request: RegisterUserRequest): Promise<{ message: string }> {
    this.logger.info(`Register new user ${JSON.stringify(request)}`);
    const registerRequest = this.validationService.validate(UserValidation.REGISTER, request);

    const isRegistered = await this.prismaService.user.findUnique({ where: { email: registerRequest.email } });
    if (isRegistered) throw new HttpException('Email already registered, please login', 400);

    const user = await this.prismaService.user.create({
      data: {
        name: registerRequest.name,
        email: registerRequest.email,
        password: await bcrypt.hash(registerRequest.password, 10),
        score: 0,
      },
    });
    if (!user) throw new HttpException('Register failed', 400);

    // set cookie

    return {
      message: 'Register success, welcome',
    };
  }

  async login(request: RegisterUserRequest): Promise<{ message: string }> {
    this.logger.info(`Login user ${JSON.stringify(request)}`);
    const loginRequest = this.validationService.validate(UserValidation.LOGIN, request);

    const user = await this.prismaService.user.findUnique({ where: { email: loginRequest.email } });
    if (!user) throw new HttpException('User not found, please register first', 404);

    const isValid = await bcrypt.compare(loginRequest.password, user.password);
    if (!isValid) throw new HttpException('Invalid password', 400);

    // set cookie

    return {
      message: 'Login success, welcome back',
    };
  }
}
