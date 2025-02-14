import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { Logger } from 'winston';

@Injectable()
export class DirectMessageService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async getUserConversations(userId: number) {
    return await this.prismaService.conversation.findMany({
      where: {
        participants: {
          some: { user_id: userId, deleted_at: null },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get last message
        },
        participants: true,
      },
    });
  }

  async getMessages(user_id: number, friend_id: number) {
    this.logger.info(`Get message ${user_id} with ${friend_id}`);

    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        participants: { every: { user_id: { in: [user_id, friend_id] } } },
      },
    });

    if (!conversation) throw new BadRequestException('');

    return await this.prismaService.directMessage.findMany({
      where: {
        conversation_id: conversation.id,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(senderId: number, receiverId: number, messageText: string) {
    this.logger.info(`Send message from ${senderId} to ${receiverId}`);

    let conversation = await this.prismaService.conversation.findFirst({
      where: {
        participants: { every: { user_id: { in: [senderId, receiverId] } } },
      },
    });

    if (!conversation) {
      conversation = await this.prismaService.conversation.create({
        data: { participants: { create: [{ user_id: senderId }, { user_id: receiverId }] } },
      });
    }

    const message = await this.prismaService.directMessage.create({
      data: {
        conversation_id: conversation.id,
        sender_id: senderId,
        message: messageText,
      },
    });

    return message;
  }

  async deleteChatForUser(userId: number, friend_id: number) {
    this.logger.warn(`Delete chat from user ${userId} with ${friend_id}`);

    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        participants: { every: { user_id: { in: [userId, friend_id] } } },
      },
    });

    if (!conversation) throw new BadRequestException('');

    await this.prismaService.userOnConversation.updateMany({
      where: { user_id: userId, conversation_id: conversation.id },
      data: { deleted_at: new Date() },
    });
  }
}
