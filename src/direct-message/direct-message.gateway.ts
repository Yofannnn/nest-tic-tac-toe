import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DirectMessageService } from './direct-message.service';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway(3002, { cors: { origin: '*', credentials: true }, transports: ['websocket'] })
export class DirectMessageGateWay implements OnGatewayConnection {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private directMessageService: DirectMessageService,
    private authService: AuthService,
  ) {}

  @WebSocketServer()
  private server: Server;

  async handleConnection(client: Socket) {
    this.logger.info(`Client ${client.id} attempting to connect`);

    try {
      const cookie = client.request.headers.cookie;
      if (!cookie) {
        client.disconnect();
        return;
      }

      const jwtPayload = await this.authService.verifyAccessToken(cookie.split('=')[1]);

      client.data = { user_id: jwtPayload.id };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() request: { friend_id: number; message: string },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const player_id = client.data?.user_id as number;

    const newMessage = await this.directMessageService.sendMessage(player_id, request.friend_id, request.message);

    this.server.to(request.friend_id.toString()).emit('newMessage', newMessage);
  }
}
