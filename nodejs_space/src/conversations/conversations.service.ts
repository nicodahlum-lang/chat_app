import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOneOnOneDto } from './dto/create-one-on-one.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllConversations(userId: string) {
    try {
      const participations = await this.prisma.conversationparticipant.findMany({
        where: { userid: userId },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      avatarurl: true,
                    },
                  },
                },
              },
              messages: {
                orderBy: { createdat: 'desc' },
                take: 1,
                select: {
                  content: true,
                  createdat: true,
                  senderid: true,
                },
              },
            },
          },
        },
        orderBy: {
          conversation: {
            updatedat: 'desc',
          },
        },
      });

      const conversations = await Promise.all(
        participations.map(async (participation) => {
          const conversation = participation.conversation;
          const lastMessage = conversation.messages[0];

          // Count unread messages
          const unreadCount = await this.prisma.message.count({
            where: {
              conversationid: conversation.id,
              createdat: {
                gt: participation.lastreadat || new Date(0),
              },
              senderid: {
                not: userId,
              },
            },
          });

          return {
            id: conversation.id,
            type: conversation.type,
            name: conversation.name,
            avatarUrl: conversation.avatarurl,
            participants: conversation.participants
              .filter((p) => p.userid !== userId)
              .map((p) => ({
                id: p.user.id,
                name: p.user.name,
                avatarUrl: p.user.avatarurl,
              })),
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  createdAt: lastMessage.createdat.toISOString(),
                  senderId: lastMessage.senderid,
                }
              : null,
            unreadCount,
            createdAt: conversation.createdat.toISOString(),
          };
        }),
      );

      return { conversations };
    } catch (error) {
      this.logger.error('Get all conversations error', error);
      throw error;
    }
  }

  async createOneOnOne(userId: string, createOneOnOneDto: CreateOneOnOneDto) {
    try {
      const { participantId } = createOneOnOneDto;

      if (participantId === userId) {
        throw new BadRequestException('Cannot create conversation with yourself');
      }

      // Check if participant exists
      const participant = await this.prisma.user.findUnique({
        where: { id: participantId },
      });

      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      // Check if conversation already exists
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          type: 'ONE_ON_ONE',
          participants: {
            every: {
              userid: {
                in: [userId, participantId],
              },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarurl: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation && existingConversation.participants.length === 2) {
        return {
          id: existingConversation.id,
          type: existingConversation.type,
          participants: existingConversation.participants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            avatarUrl: p.user.avatarurl,
          })),
          createdAt: existingConversation.createdat.toISOString(),
        };
      }

      // Create new conversation
      const conversation = await this.prisma.conversation.create({
        data: {
          type: 'ONE_ON_ONE',
          participants: {
            create: [
              { userid: userId },
              { userid: participantId },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarurl: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`One-on-one conversation created: ${conversation.id}`);

      return {
        id: conversation.id,
        type: conversation.type,
        participants: conversation.participants.map((p) => ({
          id: p.user.id,
          name: p.user.name,
          avatarUrl: p.user.avatarurl,
        })),
        createdAt: conversation.createdat.toISOString(),
      };
    } catch (error) {
      this.logger.error('Create one-on-one conversation error', error);
      throw error;
    }
  }

  async createGroup(userId: string, createGroupDto: CreateGroupDto) {
    try {
      const { name, participantIds, avatarUrl } = createGroupDto;

      // Validate all participants exist
      const participants = await this.prisma.user.findMany({
        where: { id: { in: participantIds } },
      });

      if (participants.length !== participantIds.length) {
        throw new BadRequestException('Some participants not found');
      }

      // Create group conversation
      const allParticipantIds = [userId, ...participantIds];
      const uniqueParticipantIds = [...new Set(allParticipantIds)];

      const conversation = await this.prisma.conversation.create({
        data: {
          type: 'GROUP',
          name,
          avatarurl: avatarUrl,
          participants: {
            create: uniqueParticipantIds.map((id) => ({ userid: id })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarurl: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Group conversation created: ${conversation.id}`);

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        avatarUrl: conversation.avatarurl,
        participants: conversation.participants.map((p) => ({
          id: p.user.id,
          name: p.user.name,
          avatarUrl: p.user.avatarurl,
        })),
        createdAt: conversation.createdat.toISOString(),
      };
    } catch (error) {
      this.logger.error('Create group conversation error', error);
      throw error;
    }
  }

  async getConversationDetails(conversationId: string, userId: string) {
    try {
      const participation = await this.prisma.conversationparticipant.findFirst({
        where: {
          conversationid: conversationId,
          userid: userId,
        },
      });

      if (!participation) {
        throw new ForbiddenException('You are not a participant of this conversation');
      }

      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarurl: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        avatarUrl: conversation.avatarurl,
        participants: conversation.participants.map((p) => ({
          id: p.user.id,
          name: p.user.name,
          avatarUrl: p.user.avatarurl,
          joinedAt: p.joinedat.toISOString(),
        })),
        createdAt: conversation.createdat.toISOString(),
      };
    } catch (error) {
      this.logger.error('Get conversation details error', error);
      throw error;
    }
  }

  async addParticipants(conversationId: string, userId: string, addParticipantsDto: AddParticipantsDto) {
    try {
      // Check if user is a participant
      const participation = await this.prisma.conversationparticipant.findFirst({
        where: {
          conversationid: conversationId,
          userid: userId,
        },
      });

      if (!participation) {
        throw new ForbiddenException('You are not a participant of this conversation');
      }

      // Check if conversation is a group
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type !== 'GROUP') {
        throw new ForbiddenException('Can only add participants to group conversations');
      }

      // Validate all participants exist
      const participants = await this.prisma.user.findMany({
        where: { id: { in: addParticipantsDto.participantIds } },
      });

      if (participants.length !== addParticipantsDto.participantIds.length) {
        throw new BadRequestException('Some participants not found');
      }

      // Add participants (skip if already exists)
      const existingParticipants = await this.prisma.conversationparticipant.findMany({
        where: {
          conversationid: conversationId,
          userid: { in: addParticipantsDto.participantIds },
        },
      });

      const existingUserIds = new Set(existingParticipants.map((p) => p.userid));
      const newParticipantIds = addParticipantsDto.participantIds.filter((id) => !existingUserIds.has(id));

      if (newParticipantIds.length > 0) {
        await this.prisma.conversationparticipant.createMany({
          data: newParticipantIds.map((id) => ({
            conversationid: conversationId,
            userid: id,
          })),
        });
      }

      // Get updated participants list
      const updatedParticipants = await this.prisma.conversationparticipant.findMany({
        where: { conversationid: conversationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarurl: true,
            },
          },
        },
      });

      this.logger.log(`Participants added to conversation: ${conversationId}`);

      return {
        success: true,
        participants: updatedParticipants.map((p) => ({
          id: p.user.id,
          name: p.user.name,
          avatarUrl: p.user.avatarurl,
        })),
      };
    } catch (error) {
      this.logger.error('Add participants error', error);
      throw error;
    }
  }
}
