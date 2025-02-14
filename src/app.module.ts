import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { FriendModule } from './friend/friend.module';
import { GameChatModule } from './game-chat/game-chat.module';
import { DirectMessageModule } from './direct-message/direct-message.module';

@Module({
  imports: [CommonModule, GameModule, AuthModule, RoomModule, FriendModule, GameChatModule, DirectMessageModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
