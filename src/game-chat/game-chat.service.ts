import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject, Injectable } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { GameChatValidation } from './game-chat.validation';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class GameChatService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private prismaService: PrismaService,
  ) {}

  async createGameChat(request: { room_id: number; player_id: number; message: string }) {
    this.logger.info(`Create Game Chat ${JSON.stringify(request)}`);

    const gameChatRequest = this.validationService.validate(GameChatValidation.CREATECHAT, request);

    const newGameChat = await this.prismaService.gameChat.create({
      data: gameChatRequest,
    });

    return newGameChat;
  }

  async getGameChat(room_id: number) {
    this.logger.info(`Get Game Message ${room_id}`);

    return await this.prismaService.gameChat.findMany({ where: { room_id }, orderBy: { createdAt: 'asc' } });
  }
}
