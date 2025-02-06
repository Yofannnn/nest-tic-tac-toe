import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
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

@WebSocketGateway(3002, { cors: { origin: '*', credentials: true }, transports: ['websocket'] })
export class GameGateway implements OnGatewayConnection {
  @WebSocketServer() private server: Server;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private authService: AuthService,
    private gameService: GameService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookie = client.request.headers.cookie;
      if (!cookie) {
        client.disconnect();
        return;
      }

      const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

      client.data = { user_id: jwtPayload.id };
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${JSON.stringify(error)}`);
      client.disconnect();
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() request: { room_id: number }) {
    try {
      await client.join(request.room_id.toString());
      this.logger.info(`Client joined game room ${request.room_id}`);

      const initialState = await this.gameService.initializeGame(request.room_id);

      this.server.to(request.room_id.toString()).emit('gameUpdate', initialState);
    } catch (error) {
      this.server.emit('error', error);
    }
  }

  @SubscribeMessage('getGameUpdate')
  async handleGetGameUpdate(@MessageBody() request: { room_id: number }) {
    try {
      const gameState = await this.gameService.getGameState(request.room_id);

      this.server.to(request.room_id.toString()).emit('gameUpdate', gameState);
    } catch (error: any) {
      this.server.emit('error', error);
    }
  }

  @SubscribeMessage('makeMove')
  async handleMove(@ConnectedSocket() client: Socket, @MessageBody() request: { room_id: number; position: number }) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const player_id = client.data?.user_id as number;
      const gameState = await this.gameService.makeMove({ ...request, player_id });

      this.server.to(request.room_id.toString()).emit('gameUpdate', gameState);
    } catch (error: any) {
      this.server.emit('error', error);
    }
  }

  @SubscribeMessage('endGame')
  async handleEndGame(@MessageBody() request: { room_id: number }) {
    try {
      const gameState = await this.gameService.endGame(request.room_id);

      this.server.to(request.room_id.toString()).emit('gameEnded', gameState);
      this.server.socketsLeave(request.room_id.toString());
    } catch (error: any) {
      this.server.emit('error', error);
    }
  }
}
