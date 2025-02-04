import { Body, Controller, Get, Headers, Patch, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { AuthService } from 'src/auth/auth.service';

@Controller('game')
export class GameController {
  constructor(
    private gameService: GameService,
    private authService: AuthService,
  ) {}

  @Post('/create-room')
  async createRoom(@Headers('cookie') cookie: string, @Body() request: { name: string }) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    const payload = { name: request.name, player1_id: jwtPayload.id };

    return await this.gameService.createRoom(payload);
  }

  @Patch('/join-room')
  async joinRoom(@Headers('cookie') cookie: string, @Body() request: { id: number }) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    const payload = { room_id: request.id, player2_id: jwtPayload.id };

    return await this.gameService.joinRoom(payload);
  }

  @Get('/room-list')
  async roomList() {
    return await this.gameService.getRoomList();
  }
}
