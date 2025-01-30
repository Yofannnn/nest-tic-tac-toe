import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { IRegisterUserRequest } from 'src/types/user.type';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async createUser(request: IRegisterUserRequest) {
    const user = await this.prismaService.user.create({
      data: {
        name: request.name,
        email: request.email,
        password: await bcrypt.hash(request.password, 10),
      },
    });
    if (!user) throw new HttpException('Register failed', 400);

    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    return user;
  }

  async getUserById(id: number) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    return user;
  }
}
