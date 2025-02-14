import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { RoomValidation } from './room.validation';
import {
  IResponseLeaveRoom,
  IResponseCreateAndJoinRoom,
  IRoom,
  ROOM_STATUS,
  IGetRoomsWaitingResponse,
} from 'src/types/room.type';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RoomService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private prismaService: PrismaService,
  ) {}

  async getActiveRoomsByPlayerId(player_id: number) {
    this.logger.info(`Get Active Rooms`);
    return await this.prismaService.room.findFirst({
      where: { OR: [{ player1_id: player_id }, { player2_id: player_id }] },
    });
  }

  async getRoomsWaiting(): Promise<IGetRoomsWaitingResponse[]> {
    this.logger.info(`Get Room`);
    const rooms = await this.prismaService.room.findMany({ where: { status: ROOM_STATUS.WAITING } });

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      owner_id: room.player1_id,
      status: room.status,
      isPrivate: !!room.password,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));
  }

  async createRoom(request: { name: string; player1_id: number; password?: number }): Promise<IResponseCreateAndJoinRoom> {
    this.logger.info(`Create new Room ${JSON.stringify(request)}`);
    const createRoomRequest = this.validationService.validate(RoomValidation.CREATEROOM, request);

    const newRoom = await this.prismaService.room.create({
      data: {
        name: createRoomRequest.name,
        player1_id: createRoomRequest.player1_id,
        ...(createRoomRequest.password && { password: await bcrypt.hash(String(createRoomRequest.password), 10) }),
      },
    });

    return { message: 'Create room success', room: newRoom as IRoom, user_id: createRoomRequest.player1_id };
  }

  async joinRoom(request: { room_id: number; player2_id: number; password?: number }): Promise<IResponseCreateAndJoinRoom> {
    this.logger.info(`Join Room ${JSON.stringify(request)}`);
    const joinRoomRequest = this.validationService.validate(RoomValidation.JOINROOM, request);

    const room = await this.prismaService.room.findUnique({ where: { id: joinRoomRequest.room_id } });
    if (!room) throw new NotFoundException('Room not found.');
    if ((room.status as ROOM_STATUS) !== ROOM_STATUS.WAITING) throw new BadRequestException('Room is not available.');
    if (room.player1_id === joinRoomRequest.player2_id) throw new BadRequestException('Player cannot join their own room.');
    if (room.password && joinRoomRequest.password) {
      const isValidPasswordRoom = await bcrypt.compare(String(joinRoomRequest.password), room.password);
      if (!isValidPasswordRoom) throw new BadRequestException('Invalid password.');
    }

    const updatedRoom = await this.prismaService.room.update({
      where: { id: joinRoomRequest.room_id },
      data: { player2_id: joinRoomRequest.player2_id, status: ROOM_STATUS.PLAYING },
    });

    return { message: 'Join room success', room: updatedRoom as IRoom, user_id: joinRoomRequest.player2_id };
  }

  async leaveRoom(room_id: number, player_id: number): Promise<IResponseLeaveRoom> {
    this.logger.info(`End Game ${room_id}`);

    const room = await this.prismaService.room.findUnique({ where: { id: room_id } });
    if (!room) throw new NotFoundException('Room not found.');
    if (!room.player2_id) {
      await this.prismaService.room.delete({ where: { id: room_id } });
      await this.prismaService.gameChat.deleteMany({ where: { room_id } });
      return { message: `Room ${room_id} was deleted.` };
    }

    if (room.player1_id !== player_id && room.player2_id !== player_id) throw new BadRequestException('Player not in room.');

    const matchHistory = await this.prismaService.matchHistory.findUnique({ where: { room_id } });

    await this.prismaService.gameState.delete({ where: { room_id } });

    await this.prismaService.room.update({
      where: { id: room_id },
      data: { status: ROOM_STATUS.FINISHED },
    });

    const updatedMatchHistory = await this.prismaService.matchHistory.update({
      where: { room_id },
      data: { duration: new Date().getTime() - new Date(matchHistory?.createdAt as Date).getTime() },
    });

    return { message: `Room ${room_id} was finished.`, match_history: updatedMatchHistory };
  }
}
