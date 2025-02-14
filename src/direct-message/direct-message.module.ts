import { Module } from '@nestjs/common';
import { DirectMessageController } from './direct-message.controller';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageGateWay } from './direct-message.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DirectMessageController],
  providers: [DirectMessageService, DirectMessageGateWay],
})
export class DirectMessageModule {}
