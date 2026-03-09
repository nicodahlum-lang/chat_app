import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) { }

  async searchUsers(query: string, currentUserId: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          AND: [
            {
              id: {
                not: currentUserId, // Exclude current user from search
              },
            },
            {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarurl: true,
        },
        take: 50,
      });

      return {
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarurl,
        })),
      };
    } catch (error) {
      this.logger.error('Search users error', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(updateProfileDto.name && { name: updateProfileDto.name }),
          ...(updateProfileDto.avatarUrl !== undefined && { avatarurl: updateProfileDto.avatarUrl }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarurl: true,
        },
      });

      this.logger.log(`User profile updated: ${userId}`);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarurl,
      };
    } catch (error) {
      this.logger.error('Update profile error', error);
      throw error;
    }
  }

  async getOnlineUsers() {
    try {
      const onlineUserIds = this.chatGateway.getOnlineUsers();
      return { onlineUsers: onlineUserIds };
    } catch (error) {
      this.logger.error('Error getting online users', error);
      throw error;
    }
  }

  async updatePushToken(userId: string, token: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { pushtoken: token },
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating push token for ${userId}`, error);
      throw error;
    }
  }

  async updatePublicKey(userId: string, publicKey: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { publickey: publicKey },
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error updating public key for ${userId}`, error);
      throw error;
    }
  }

  async getPublicKey(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { publickey: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return { publicKey: user.publickey };
    } catch (error) {
      this.logger.error(`Error fetching public key for ${userId}`, error);
      throw error;
    }
  }

  async updateBackground(userId: string, backgroundUrl: string | null) {
    try {
      const user = await (this.prisma.user as any).update({
        where: { id: userId },
        data: { themebackground: backgroundUrl },
        select: {
          id: true,
          themebackground: true,
        },
      });
      return { success: true, backgroundUrl: user.themebackground };
    } catch (error) {
      this.logger.error(`Error updating background for ${userId}`, error);
      throw error;
    }
  }
}
