import { Controller, Get, Headers, Param, Patch } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { AuthService } from 'src/auth/auth.service';

@Controller('direct-message')
export class DirectMessageController {
  constructor(
    private directMessageService: DirectMessageService,
    private authService: AuthService,
  ) {}

  @Get()
  async getUserConversations(@Headers('cookie') cookie: string) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    return await this.directMessageService.getUserConversations(jwtPayload.id);
  }

  @Get('/:friend_id')
  async getDirectMessage(@Headers('cookie') cookie: string, @Param('friend_id') friend_id: string) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    return await this.directMessageService.getMessages(jwtPayload.id, Number(friend_id));
  }

  @Patch('delete-chat/:friend_id')
  async deleteChat(@Headers('cookie') cookie: string, @Param('friend_id') friend_id: string) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    await this.directMessageService.deleteChatForUser(jwtPayload.id, Number(friend_id));

    return { message: 'Success to delete chat' };
  }
}
