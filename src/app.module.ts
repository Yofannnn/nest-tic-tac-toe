import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { RoomModule } from './room/room.module';
import { FriendModule } from './friend/friend.module';

@Module({
  imports: [CommonModule, GameModule, AuthModule, ChatModule, RoomModule, FriendModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
