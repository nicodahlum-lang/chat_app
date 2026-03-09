import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly prisma;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(jwtService: JwtService, configService: ConfigService, prisma: PrismaService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinConversation(data: {
        conversationId: string;
    }, client: Socket): {
        success: boolean;
        conversationId: string;
    };
    handleLeaveConversation(data: {
        conversationId: string;
    }, client: Socket): {
        success: boolean;
        conversationId: string;
    };
    handleTypingStart(data: {
        conversationId: string;
    }, client: Socket): Promise<{
        success: boolean;
    }>;
    handleTypingStop(data: {
        conversationId: string;
    }, client: Socket): Promise<{
        success: boolean;
    }>;
    emitNewMessage(conversationId: string, message: any): void;
    emitMessageViewed(conversationId: string, messageId: string, userId: string, viewedAt: string): void;
    emitConversationUpdated(conversationId: string, updates: any): void;
    emitMessageDeleted(conversationId: string, messageId: string): void;
    emitMessageReaction(conversationId: string, messageId: string, userId: string, emoji: string | null): void;
    getOnlineUsers(): string[];
    handleCallOffer(data: {
        conversationId: string;
        offer: any;
    }, client: Socket): void;
    handleCallAnswer(data: {
        conversationId: string;
        answer: any;
    }, client: Socket): void;
    handleIceCandidate(data: {
        conversationId: string;
        candidate: any;
    }, client: Socket): void;
    handleCallEnd(data: {
        conversationId: string;
    }, client: Socket): void;
}
