import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserRequest } from 'src/model/user.model';

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  async register(@Body() request: RegisterUserRequest) {
    const result = await this.userService.register(request);
    return result;
  }

  @Post('login')
  async login(@Body() request: RegisterUserRequest) {
    const result = await this.userService.login(request);
    return result;
  }
}
