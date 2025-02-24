import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { FRIEND_STATUS, IResponseGetFriends } from 'src/types/friend.type';

@Injectable()
export class FriendService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async getFriends(userId: number): Promise<IResponseGetFriends[]> {
    this.logger.info(`Fetching friends for user ${userId}`);

    const relationships = await this.prismaService.friend.findMany({
      where: {
        OR: [{ user_id: userId }, { friend_id: userId }],
        status: FRIEND_STATUS.ACCEPTED,
      },
      include: { user: true, friend: true },
    });

    return relationships.map((relationship) => {
      return relationship.user.id === userId
        ? {
            id: relationship.friend.id,
            name: relationship.friend.name,
            createdAt: relationship.friend.createdAt,
            updatedAt: relationship.friend.updatedAt,
          }
        : {
            id: relationship.user.id,
            name: relationship.user.name,
            createdAt: relationship.user.createdAt,
            updatedAt: relationship.user.updatedAt,
          };
    });
  }

  async getPending(userId: number): Promise<IResponseGetFriends[]> {
    this.logger.info(`Fetching pending friend requests for user ${userId}`);

    const requests = await this.prismaService.friend.findMany({
      where: { friend_id: userId, status: FRIEND_STATUS.PENDING },
      include: { user: true },
    });

    return requests.map((friend) => ({
      id: friend.user.id,
      name: friend.user.name,
      createdAt: friend.user.createdAt,
      updatedAt: friend.user.updatedAt,
    }));
  }

  async addFriend(senderId: number, receiverId: number) {
    this.logger.info(`User ${senderId} sending friend request to ${receiverId}`);

    const existingFriend = await this.prismaService.friend.findFirst({
      where: { user_id: senderId, friend_id: receiverId },
    });

    if (existingFriend) {
      if ((existingFriend.status as FRIEND_STATUS) === FRIEND_STATUS.ACCEPTED)
        throw new BadRequestException('You are already friends.');
      if ((existingFriend.status as FRIEND_STATUS) === FRIEND_STATUS.PENDING && existingFriend.user_id === senderId)
        throw new BadRequestException('Friend request already sent.');
      if ((existingFriend.status as FRIEND_STATUS) === FRIEND_STATUS.PENDING && existingFriend.friend_id === senderId)
        throw new BadRequestException('This user has already sent you a request. Accept it instead.');
    }

    const newFriend = await this.prismaService.friend.create({
      data: { user_id: senderId, friend_id: receiverId },
    });

    return { message: 'Friend request sent. Waiting for approval.', friend: newFriend };
  }

  async acceptFriend(senderId: number, receiverId: number) {
    this.logger.info(`User ${receiverId} accepting friend request from ${senderId}`);

    const request = await this.prismaService.friend.findFirst({
      where: { user_id: senderId, friend_id: receiverId, status: FRIEND_STATUS.PENDING },
    });

    if (!request) throw new BadRequestException('Friend request not found.');

    await this.prismaService.friend.updateMany({
      where: { user_id: senderId, friend_id: receiverId },
      data: { status: FRIEND_STATUS.ACCEPTED },
    });

    return { message: 'Friend request accepted' };
  }

  async rejectFriend(senderId: number, receiverId: number) {
    this.logger.info(`User ${receiverId} rejecting friend request from ${senderId}`);

    const deleted = await this.prismaService.friend.deleteMany({
      where: { user_id: senderId, friend_id: receiverId },
    });

    if (deleted.count === 0) throw new BadRequestException('Friend request not found.');

    return { message: 'Friend request rejected' };
  }
}
