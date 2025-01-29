import { Body, Controller, Patch, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('api/game')
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('/create-room')
  async createRoom(@Body() request: { name: string }) {
    const payload = {
      name: request.name,
      player1_id: 123, // from cookie
    };

    return await this.gameService.createRoom(payload);
  }

  @Patch('/join-room')
  async joinRoom(@Body() request: { roomId: number }) {
    const payload = {
      room_id: request.roomId,
      player2_id: 123, // from cookie
    };

    return await this.gameService.joinRoom(payload);
  }
}
