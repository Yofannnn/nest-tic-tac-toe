import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { IResponseGetDirectMessages, IResponseGetUserConversations } from 'src/types/direct-message.type';
import { Logger } from 'winston';

@Injectable()
export class DirectMessageService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async getUserConversations(userId: number): Promise<IResponseGetUserConversations> {
    const conversations = await this.prismaService.conversation.findMany({
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

    return {
      user_id: userId,
      message: 'Successfully get user conversations',
      conversations,
    };
  }

  async getMessages(user_id: number, friend_id: number): Promise<IResponseGetDirectMessages> {
    this.logger.info(`Get message ${user_id} with ${friend_id}`);

    const conversation = await this.prismaService.conversation.findFirst({
      where: {
        participants: { every: { user_id: { in: [user_id, friend_id] } } },
      },
    });

    const friend = await this.prismaService.user.findUnique({ where: { id: friend_id } });

    if (!conversation || !friend) throw new BadRequestException('You have no conversation with this user.');

    const direct_messages = await this.prismaService.directMessage.findMany({
      where: {
        conversation_id: conversation.id,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      direct_messages,
      friend: {
        id: friend.id,
        name: friend.name,
        createdAt: friend.createdAt,
        updatedAt: friend.updatedAt,
      },
    };
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

  async readMessage(senderId: number, receiverId: number) {
    this.logger.info(`Read message from ${senderId} to ${receiverId}`);

    const conversation = await this.prismaService.conversation.findFirst({
      where: { participants: { every: { user_id: { in: [senderId, receiverId] } } } },
    });

    if (!conversation) throw new BadRequestException('You have no conversation with this user.');

    return await this.prismaService.directMessage.updateManyAndReturn({
      where: {
        conversation_id: conversation.id,
        sender_id: senderId,
        isRead: false,
      },
      data: { isRead: true },
    });
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
