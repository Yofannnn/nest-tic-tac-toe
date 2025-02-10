import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { RoomService } from './room.service';
import { AuthService } from 'src/auth/auth.service';

@Controller('room')
export class RoomController {
  constructor(
    private roomService: RoomService,
    private authService: AuthService,
  ) {}

  @Post('/create')
  async createRoom(@Headers('cookie') cookie: string, @Body() request: { name: string; password?: number }) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    const payload = { name: request.name, player1_id: jwtPayload.id, password: request.password };

    return await this.roomService.createRoom(payload);
  }

  @Patch('/join')
  async joinRoom(@Headers('cookie') cookie: string, @Body() request: { id: number; password?: number }) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

    const payload = { room_id: request.id, player2_id: jwtPayload.id, password: request.password };

    return await this.roomService.joinRoom(payload);
  }

  @Delete('/delete/:room_id')
  async deleteRoom(@Headers('cookie') cookie: string, @Param('room_id') room_id: string) {
    const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);
    const player1_id = jwtPayload.id;

    return this.roomService.deleteRoom(Number(room_id), player1_id);
  }

  @Get()
  async roomList() {
    return await this.roomService.getRoomsWaiting();
  }

  @Get('/match-history:room_id')
  async getMacthHistory(@Body() request: { room_id: number }) {
    return this.roomService.getMatchHistoryByRoomId(request.room_id);
  }
}
