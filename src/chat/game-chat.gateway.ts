import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { GameChatService } from './game-chat.service';

@WebSocketGateway(3002, { cors: { origin: '*', credentials: true }, transports: ['websocket'] })
export class GameChatGateway implements OnGatewayConnection {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private authService: AuthService,
    private gameChatService: GameChatService,
  ) {}

  @WebSocketServer()
  private server: Server;

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
      client.disconnect();
    }
  }

  @SubscribeMessage('startChat')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() request: { room_id: number }) {
    await client.join(request.room_id.toString());
    this.logger.info(`Client joined chat ${request.room_id}`);

    const gameChat = await this.gameChatService.getGameChat(request.room_id);

    this.server.to(request.room_id.toString()).emit('updateChat', gameChat);
  }

  @SubscribeMessage('sendMessage')
  async handleGameChat(@ConnectedSocket() client: Socket, @MessageBody() request: { room_id: number; message: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const player_id = client.data?.user_id as number;
    const newMessage = await this.gameChatService.createGameChat({ ...request, player_id });

    const gameChat = await this.gameChatService.getGameChat(request.room_id);

    this.server.to(request.room_id.toString()).emit('newMessage', newMessage);
    this.server.to(request.room_id.toString()).emit('updateChat', gameChat);
  }
}
