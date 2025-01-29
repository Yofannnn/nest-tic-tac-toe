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
import { GameService } from './game.service';

@WebSocketGateway(0, { namespace: 'game', cors: { origin: '*' }, transports: ['websocket'] })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private gameService: GameService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.info(`Client connected: ${client.id}`);

    const roomId = client.handshake.query.roomId as string;
    if (!roomId) {
      this.logger.warn(`Client ${client.id} tried to connect without roomId`);
      client.disconnect();
      return;
    }

    await client.join(roomId);
    this.logger.info(`Client ${client.id} joined room ${roomId}`);

    // Fetch initial game state
    const initialState = await this.gameService.getGameState(Number(roomId));
    client.emit('gameState', initialState);
  }

  @SubscribeMessage('startGame')
  async handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() { roomId }: { roomId: number }) {
    const initialState = await this.gameService.initializeGame(roomId);

    // Notify all players
    this.server.to(roomId.toString()).emit('gameStarted', initialState);
  }

  @SubscribeMessage('makeMove')
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() request: { room_id: number; player_id: number; position: number },
  ) {
    try {
      const gameState = await this.gameService.makeMove(request);

      // Notify all players
      this.server.to(request.room_id.toString()).emit('gameUpdate', gameState);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('endGame')
  async handleEndGame(@ConnectedSocket() client: Socket, @MessageBody() { roomId }: { roomId: number }) {
    await this.gameService.endGame(roomId);

    // Notify all players and disconnect them
    this.server.to(roomId.toString()).emit('gameEnded', { roomId });
    this.server.socketsLeave(roomId.toString());
  }

  async handleDisconnect(client: Socket) {
    this.logger.info(`Client disconnected: ${client.id}`);

    const roomId = client.handshake.query.roomId as string;

    if (roomId) {
      await client.leave(roomId);
      this.logger.info(`Client ${client.id} left room ${roomId}`);
    }
  }
}
