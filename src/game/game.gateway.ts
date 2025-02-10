import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthService } from 'src/auth/auth.service';
import { GameService } from './game.service';
import { RoomService } from 'src/room/room.service';
import { IInitializeGame } from 'src/types/game.type';

@WebSocketGateway(3002, { cors: { origin: '*', credentials: true }, transports: ['polling', 'websocket'] })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private authService: AuthService,
    private gameService: GameService,
    private roomService: RoomService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.info(`Client ${client.id} attempting to connect`);

    try {
      const clientCookie = client.request.headers.cookie;
      if (!clientCookie) {
        client.disconnect();
        return;
      }

      const jwtPayload = await this.authService.verifyAccessToken(clientCookie.split('=')[1]);

      client.data = { user_id: jwtPayload.id };
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${JSON.stringify(error)}`);
      client.disconnect();
    }
  }

  @SubscribeMessage('initializeGame')
  async handleInitializeGame(@ConnectedSocket() client: Socket, @MessageBody() request: { room_id: number }) {
    try {
      await client.join(request.room_id.toString());
      this.logger.info(`Client initialize game ${request.room_id}`);

      const initialState = await this.gameService.initializeGame(request.room_id);
      const gamePlayers = await this.gameService.getGamePlayers(request.room_id);

      const initialGame: IInitializeGame = { initial_game: initialState, room_players: gamePlayers };

      this.server.to(request.room_id.toString()).emit('initializeGame', initialGame);
    } catch (error) {
      client.emit('error', error);
    }
  }

  @SubscribeMessage('makeMove')
  async handleMove(@ConnectedSocket() client: Socket, @MessageBody() request: { room_id: number; position: number }) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const player_id = client.data?.user_id as number;
      const gameState = await this.gameService.makeMove({ ...request, player_id });

      this.server.to(request.room_id.toString()).emit('gameUpdate', gameState);

      if (gameState.status !== 'active') {
        const matchHistory = await this.gameService.getGameHistory(request.room_id);
        this.server.to(request.room_id.toString()).emit('matchHistory', matchHistory);
      }
    } catch (error: any) {
      client.emit('error', error);
    }
  }

  // handle reconnecting
  @SubscribeMessage('reconnect')
  async handleReconnect(@ConnectedSocket() client: Socket, @MessageBody() request: { room_id: number }) {
    try {
      const gameState = await this.gameService.getGameState(request.room_id);
      const matchHistory = await this.gameService.getGameHistory(request.room_id);

      this.server.to(request.room_id.toString()).emit('gameUpdate', gameState);
      this.server.to(request.room_id.toString()).emit('matchHistory', matchHistory);
    } catch (error: any) {
      client.emit('error', error);
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() request: { room_id: number }) {
    try {
      await client.leave(request.room_id.toString());
      this.logger.info(`Client left room ${request.room_id}`);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const player_id = client.data?.user_id as number;

      const leaveRoom = await this.roomService.leaveRoom(request.room_id, player_id);
      this.server.to(request.room_id.toString()).emit('leaveRoom', leaveRoom);
    } catch (error) {
      client.emit('error', error);
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.warn(`Client ${client.id} disconnected`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = client.data?.user_id as number | undefined;
    if (!userId) return;

    try {
      const activeRoom = await this.roomService.getActiveRoomsByPlayerId(userId);

      if (!activeRoom) return;

      this.server.to(activeRoom.id.toString()).emit('playerDisconnected', { user_id: userId });
    } catch (error) {
      this.logger.error(`Database error in handleDisconnect: ${error}`);
    }
  }
}
