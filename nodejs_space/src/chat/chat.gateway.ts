import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from query params or auth header
      const token =
        client.handshake.query.token as string ||
        client.handshake.auth.token as string ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Store user info in socket data
      client.data.userId = userId;
      client.data.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      // Track user socket
      const isNewConnection = !this.userSockets.has(userId);
      if (isNewConnection) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Broadcast user online if it's their first connection
      if (isNewConnection) {
        this.server.emit('user:online', { userId });
      }

      this.logger.log(`Client connected: ${client.id}, User: ${user.name} (${userId})`);
    } catch (error) {
      this.logger.error('Connection error', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          // Broadcast user offline
          this.server.emit('user:offline', {
            userId,
            lastSeen: new Date().toISOString()
          });
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId } = data;
    client.join(`conversation:${conversationId}`);
    this.logger.log(`User ${client.data.userId} joined conversation: ${conversationId}`);
    return { success: true, conversationId };
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId } = data;
    client.leave(`conversation:${conversationId}`);
    this.logger.log(`User ${client.data.userId} left conversation: ${conversationId}`);
    return { success: true, conversationId };
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId } = data;
    const userId = client.data.userId;
    const userName = client.data.user.name;

    // Store typing indicator in database
    await this.prisma.typingindicator.upsert({
      where: {
        conversationid_userid: {
          conversationid: conversationId,
          userid: userId,
        },
      },
      update: {
        timestamp: new Date(),
      },
      create: {
        conversationid: conversationId,
        userid: userId,
        timestamp: new Date(),
      },
    });

    // Broadcast to other users in the conversation
    client.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
      userName,
    });

    this.logger.log(`User ${userId} started typing in conversation: ${conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId } = data;
    const userId = client.data.userId;

    // Remove typing indicator from database
    await this.prisma.typingindicator.deleteMany({
      where: {
        conversationid: conversationId,
        userid: userId,
      },
    });

    // Broadcast to other users in the conversation
    client.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId,
    });

    this.logger.log(`User ${userId} stopped typing in conversation: ${conversationId}`);
    return { success: true };
  }

  // Method to emit new message (called from messages service)
  emitNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', {
      conversationId,
      message,
    });
    this.logger.log(`New message emitted to conversation: ${conversationId}`);
  }

  // Method to emit message viewed (called from messages service)
  emitMessageViewed(conversationId: string, messageId: string, userId: string, viewedAt: string) {
    this.server.to(`conversation:${conversationId}`).emit('message:viewed', {
      messageId,
      userId,
      viewedAt,
    });
    this.logger.log(`Message viewed event emitted: ${messageId}`);
  }

  // Method to emit conversation updated (called from conversations service)
  emitConversationUpdated(conversationId: string, updates: any) {
    this.server.to(`conversation:${conversationId}`).emit('conversation:updated', {
      conversationId,
      updates,
    });
    this.logger.log(`Conversation updated event emitted: ${conversationId}`);
  }

  // Method to emit message deleted
  emitMessageDeleted(conversationId: string, messageId: string) {
    this.server.to(`conversation:${conversationId}`).emit('message:deleted', {
      messageId,
      conversationId,
    });
    this.logger.log(`Message deleted event emitted: ${messageId}`);
  }

  // Method to emit message reaction
  emitMessageReaction(conversationId: string, messageId: string, userId: string, emoji: string | null) {
    this.server.to(`conversation:${conversationId}`).emit('message:reaction', {
      conversationId,
      messageId,
      userId,
      emoji,
    });
    this.logger.log(`Message reaction emitted: ${messageId}`);
  }

  // Get currently online user IDs
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // WebRTC Signaling Events
  @SubscribeMessage('call:offer')
  handleCallOffer(
    @MessageBody() data: { conversationId: string; offer: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`conversation:${data.conversationId}`).emit('call:offer', {
      conversationId: data.conversationId,
      offer: data.offer,
      callerId: client.data.userId,
      callerName: client.data.user?.name,
    });
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @MessageBody() data: { conversationId: string; answer: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`conversation:${data.conversationId}`).emit('call:answer', {
      conversationId: data.conversationId,
      answer: data.answer,
      responderId: client.data.userId,
    });
  }

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { conversationId: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`conversation:${data.conversationId}`).emit('call:ice-candidate', {
      conversationId: data.conversationId,
      candidate: data.candidate,
      senderId: client.data.userId,
    });
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`conversation:${data.conversationId}`).emit('call:end', {
      conversationId: data.conversationId,
      enderId: client.data.userId,
    });
  }
}
