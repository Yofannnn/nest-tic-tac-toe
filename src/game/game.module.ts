import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { AuthModule } from 'src/auth/auth.module';
import { RoomModule } from 'src/room/room.module';

@Module({
  imports: [AuthModule, RoomModule],
  providers: [GameGateway, GameService],
})
export class GameModule {}
