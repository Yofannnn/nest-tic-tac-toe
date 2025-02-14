import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { GameChatService } from './game-chat.service';
import { GameChatGateway } from './game-chat.gateway';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [GameChatService, GameChatGateway],
})
export class GameChatModule {}
