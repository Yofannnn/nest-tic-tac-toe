import { Module } from '@nestjs/common';
import { GameChatGateway } from './game-chat.gateway';
import { GameChatService } from './game-chat.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [GameChatGateway, GameChatService],
})
export class ChatModule {}
