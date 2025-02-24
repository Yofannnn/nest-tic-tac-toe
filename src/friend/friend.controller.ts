import { Body, Controller, Delete, Get, Headers, Patch, Post } from '@nestjs/common';
import { FriendService } from './friend.service';
import { AuthService } from 'src/auth/auth.service';

@Controller('friend')
export class FriendController {
  constructor(
    private friendService: FriendService,
    private authService: AuthService,
  ) {}

  @Get()
  async getFriends(@Headers('cookie') cookie: string) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    return await this.friendService.getFriends(jwtPayload.id);
  }

  @Get('/pending')
  async getPending(@Headers('cookie') cookie: string) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    return await this.friendService.getPending(jwtPayload.id);
  }

  @Post('/add')
  async addFriend(@Headers('cookie') cookie: string, @Body() request: { friend_id: number }) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    return await this.friendService.addFriend(jwtPayload.id, request.friend_id);
  }

  @Patch('/accept')
  async acceptFriend(@Headers('cookie') cookie: string, @Body() request: { friend_id: number }) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    return await this.friendService.acceptFriend(request.friend_id, jwtPayload.id);
  }

  @Delete('/reject')
  async rejectFriend(@Headers('cookie') cookie: string, @Body() request: { friend_id: number }) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    return await this.friendService.rejectFriend(jwtPayload.id, request.friend_id);
  }
}
