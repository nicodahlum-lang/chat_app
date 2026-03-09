import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationsService: NotificationsService,
  ) { }

  async getMessages(conversationId: string, userId: string, limit: number = 50, before?: string) {
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

      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Build query conditions
      const whereCondition: any = {
        conversationid: conversationId,
      };

      if (before) {
        const beforeMessage = await this.prisma.message.findUnique({
          where: { id: before },
          select: { createdat: true },
        });

        if (beforeMessage) {
          whereCondition.createdat = {
            lt: beforeMessage.createdat,
          };
        }
      }

      const messages = await this.prisma.message.findMany({
        where: whereCondition,
        orderBy: { createdat: 'desc' },
        take: limit + 1, // Fetch one extra to check if there are more
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarurl: true,
            },
          },
          views: {
            select: {
              userid: true,
              viewedat: true,
            },
          },
          replyto: {
            select: {
              id: true,
              senderid: true,
              content: true,
              messagetype: true,
              sender: {
                select: {
                  name: true,
                }
              }
            }
          },
          reactions: true
        },
      });

      const hasMore = messages.length > limit;
      const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

      return {
        messages: messagesToReturn.map((message: any) => ({
          id: message.id,
          senderId: message.senderid,
          senderName: message.sender.name,
          senderAvatar: message.sender.avatarurl,
          content: message.content,
          messageType: message.messagetype,
          imageUrl: message.imageurl,
          audioUrl: message.audiourl,
          isDisappearing: message.isdisappearing,
          disappearDurationSeconds: message.disappeardurationseconds,
          viewedBy: (message.views || []).map((view: any) => ({
            userId: view.userid,
            viewedAt: view.viewedat.toISOString(),
          })),
          createdAt: message.createdat.toISOString(),
          isDeleted: message.isdeleted,
          replyToId: message.replytoid,
          reactions: (message.reactions || []).map((r: any) => ({
            userId: r.userid,
            emoji: r.emoji,
          })),
          quotedMessage: message.replyto ? {
            id: message.replyto.id,
            senderId: message.replyto.senderid,
            senderName: message.replyto.sender.name,
            content: message.replyto.content,
            messageType: message.replyto.messagetype,
          } : undefined,
          linkMetadata: message.linkmetadata,
        })),
        hasMore,
      };
    } catch (error) {
      this.logger.error('Get messages error', error);
      throw error;
    }
  }

  async sendMessage(conversationId: string, userId: string, sendMessageDto: SendMessageDto) {
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

      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const linkMetadata = await this.getLinkMetadata(sendMessageDto.content);

      // Create message
      const message = await this.prisma.message.create({
        data: {
          conversationid: conversationId,
          senderid: userId,
          content: sendMessageDto.content,
          messagetype: sendMessageDto.messageType,
          imageurl: sendMessageDto.imageUrl,
          audiourl: sendMessageDto.audioUrl,
          isdisappearing: sendMessageDto.isDisappearing || false,
          disappeardurationseconds: sendMessageDto.disappearDurationSeconds || 10,
          replytoid: sendMessageDto.replyToId,
          linkmetadata: linkMetadata as any,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarurl: true,
            },
          },
          replyto: {
            select: {
              id: true,
              senderid: true,
              content: true,
              messagetype: true,
              sender: {
                select: {
                  name: true,
                }
              }
            }
          },
          reactions: true
        },
      });

      // Update conversation updatedAt
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedat: new Date() },
      });

      this.logger.log(`Message sent in conversation ${conversationId} by user ${userId}`);

      // Send push notifications to other participants
      this.prisma.conversationparticipant.findMany({
        where: {
          conversationid: conversationId,
          userid: { not: userId },
        },
        include: {
          user: {
            select: { pushtoken: true },
          },
        },
      }).then((participants) => {
        for (const p of participants) {
          if (p.user.pushtoken) {
            const body = message.messagetype === 'TEXT' ? message.content : `Sent an ${message.messagetype.toLowerCase()}`;
            this.notificationsService.sendPushNotification(
              p.user.pushtoken,
              message.sender.name,
              body || 'New message',
              { conversationId, messageId: message.id }
            ).catch(e => this.logger.error('Push error', e));
          }
        }
      }).catch(e => this.logger.error('Error fetching participants for push', e));

      const messageAsAny = message as any;

      return {
        id: messageAsAny.id,
        senderId: messageAsAny.senderid,
        senderName: messageAsAny.sender.name,
        senderAvatar: messageAsAny.sender.avatarurl,
        content: messageAsAny.content,
        messageType: messageAsAny.messagetype,
        imageUrl: messageAsAny.imageurl,
        audioUrl: messageAsAny.audiourl,
        isDisappearing: messageAsAny.isdisappearing,
        disappearDurationSeconds: messageAsAny.disappeardurationseconds,
        replyToId: messageAsAny.replytoid,
        reactions: (messageAsAny.reactions || []).map((r: any) => ({
          userId: r.userid,
          emoji: r.emoji,
        })),
        quotedMessage: messageAsAny.replyto ? {
          id: messageAsAny.replyto.id,
          senderId: messageAsAny.replyto.senderid,
          senderName: messageAsAny.replyto.sender.name,
          content: messageAsAny.replyto.content,
          messageType: messageAsAny.replyto.messagetype,
        } : undefined,
        createdAt: messageAsAny.createdat.toISOString(),
        linkMetadata: messageAsAny.linkmetadata,
      };
    } catch (error) {
      this.logger.error('Send message error', error);
      throw error;
    }
  }

  async viewMessage(messageId: string, userId: string) {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: {
          views: true,
        },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Check if user is a participant of the conversation
      const participation = await this.prisma.conversationparticipant.findFirst({
        where: {
          conversationid: message.conversationid,
          userid: userId,
        },
      });

      if (!participation) {
        throw new ForbiddenException('You are not a participant of this conversation');
      }

      // Create or update message view
      const existingView = message.views.find((view) => view.userid === userId);

      if (!existingView) {
        await this.prisma.messageview.create({
          data: {
            messageid: messageId,
            userid: userId,
          },
        });
      }

      const viewedAt = existingView ? existingView.viewedat : new Date();

      this.logger.log(`Message ${messageId} viewed by user ${userId}`);

      return {
        success: true,
        viewedAt: viewedAt.toISOString(),
        shouldDisappear: message.isdisappearing,
      };
    } catch (error) {
      this.logger.error('View message error', error);
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string, userId: string) {
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

      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Update lastReadAt
      const updated = await this.prisma.conversationparticipant.update({
        where: { id: participation.id },
        data: { lastreadat: new Date() },
      });

      this.logger.log(`Conversation ${conversationId} marked as read by user ${userId}`);

      return {
        success: true,
        lastReadAt: updated.lastreadat!.toISOString(),
      };
    } catch (error) {
      this.logger.error('Mark conversation as read error', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string, userId: string) {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Only sender can delete
      if (message.senderid !== userId) {
        throw new ForbiddenException('You can only delete your own messages');
      }

      // Soft delete: set isdeleted=true, clear content and media URLs
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          isdeleted: true,
          content: null,
          imageurl: null,
          audiourl: null,
          messagetype: 'TEXT', // Reset to TEXT to clear media indicators
        },
      });

      // Emit real-time deletion event
      this.chatGateway.emitMessageDeleted(message.conversationid, messageId);

      this.logger.log(`Message ${messageId} deleted by user ${userId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error('Delete message error', error);
      throw error;
    }
  }

  async reactToMessage(messageId: string, userId: string, emoji: string) {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Check if reaction already exists
      const existingReaction = await this.prisma.messagereaction.findUnique({
        where: {
          messageid_userid: {
            messageid: messageId,
            userid: userId,
          },
        },
      });

      let finalEmoji: string | null = null;

      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          // Remove reaction if clicking the same one
          await this.prisma.messagereaction.delete({
            where: { id: existingReaction.id },
          });
        } else {
          // Update reaction to new emoji
          await this.prisma.messagereaction.update({
            where: { id: existingReaction.id },
            data: { emoji },
          });
          finalEmoji = emoji;
        }
      } else {
        // Create new reaction
        await this.prisma.messagereaction.create({
          data: {
            messageid: messageId,
            userid: userId,
            emoji,
          },
        });
        finalEmoji = emoji;
      }

      // Emit reaction using gateway
      this.chatGateway.emitMessageReaction(message.conversationid, messageId, userId, finalEmoji);

      return {
        success: true,
        emoji: finalEmoji,
      };
    } catch (error) {
      this.logger.error('React to message error', error);
      throw error;
    }
  }

  private async getLinkMetadata(content?: string) {
    if (!content) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = content.match(urlRegex);
    if (!match) return null;

    const url = match[0];
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        timeout: 5000,
      });

      const $ = cheerio.load(data);
      const metadata = {
        url,
        title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
        description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
      };

      return metadata;
    } catch (error) {
      this.logger.error(`Error fetching metadata for ${url}: ${error.message}`);
      return null;
    }
  }
}
