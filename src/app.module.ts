import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [CommonModule, UserModule, GameModule, AuthModule, ChatModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
