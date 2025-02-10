import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [RoomService],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}
