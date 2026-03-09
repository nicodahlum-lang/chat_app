"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    jwtService;
    configService;
    prisma;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    userSockets = new Map();
    constructor(jwtService, configService, prisma) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.query.token ||
                client.handshake.auth.token ||
                client.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                throw new common_1.UnauthorizedException('No token provided');
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            const userId = payload.sub;
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            client.data.userId = userId;
            client.data.user = {
                id: user.id,
                email: user.email,
                name: user.name,
            };
            const isNewConnection = !this.userSockets.has(userId);
            if (isNewConnection) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(client.id);
            if (isNewConnection) {
                this.server.emit('user:online', { userId });
            }
            this.logger.log(`Client connected: ${client.id}, User: ${user.name} (${userId})`);
        }
        catch (error) {
            this.logger.error('Connection error', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                    this.server.emit('user:offline', {
                        userId,
                        lastSeen: new Date().toISOString()
                    });
                }
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinConversation(data, client) {
        const { conversationId } = data;
        client.join(`conversation:${conversationId}`);
        this.logger.log(`User ${client.data.userId} joined conversation: ${conversationId}`);
        return { success: true, conversationId };
    }
    handleLeaveConversation(data, client) {
        const { conversationId } = data;
        client.leave(`conversation:${conversationId}`);
        this.logger.log(`User ${client.data.userId} left conversation: ${conversationId}`);
        return { success: true, conversationId };
    }
    async handleTypingStart(data, client) {
        const { conversationId } = data;
        const userId = client.data.userId;
        const userName = client.data.user.name;
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
        client.to(`conversation:${conversationId}`).emit('typing:start', {
            conversationId,
            userId,
            userName,
        });
        this.logger.log(`User ${userId} started typing in conversation: ${conversationId}`);
        return { success: true };
    }
    async handleTypingStop(data, client) {
        const { conversationId } = data;
        const userId = client.data.userId;
        await this.prisma.typingindicator.deleteMany({
            where: {
                conversationid: conversationId,
                userid: userId,
            },
        });
        client.to(`conversation:${conversationId}`).emit('typing:stop', {
            conversationId,
            userId,
        });
        this.logger.log(`User ${userId} stopped typing in conversation: ${conversationId}`);
        return { success: true };
    }
    emitNewMessage(conversationId, message) {
        this.server.to(`conversation:${conversationId}`).emit('message:new', {
            conversationId,
            message,
        });
        this.logger.log(`New message emitted to conversation: ${conversationId}`);
    }
    emitMessageViewed(conversationId, messageId, userId, viewedAt) {
        this.server.to(`conversation:${conversationId}`).emit('message:viewed', {
            messageId,
            userId,
            viewedAt,
        });
        this.logger.log(`Message viewed event emitted: ${messageId}`);
    }
    emitConversationUpdated(conversationId, updates) {
        this.server.to(`conversation:${conversationId}`).emit('conversation:updated', {
            conversationId,
            updates,
        });
        this.logger.log(`Conversation updated event emitted: ${conversationId}`);
    }
    emitMessageDeleted(conversationId, messageId) {
        this.server.to(`conversation:${conversationId}`).emit('message:deleted', {
            messageId,
            conversationId,
        });
        this.logger.log(`Message deleted event emitted: ${messageId}`);
    }
    emitMessageReaction(conversationId, messageId, userId, emoji) {
        this.server.to(`conversation:${conversationId}`).emit('message:reaction', {
            conversationId,
            messageId,
            userId,
            emoji,
        });
        this.logger.log(`Message reaction emitted: ${messageId}`);
    }
    getOnlineUsers() {
        return Array.from(this.userSockets.keys());
    }
    handleCallOffer(data, client) {
        client.to(`conversation:${data.conversationId}`).emit('call:offer', {
            conversationId: data.conversationId,
            offer: data.offer,
            callerId: client.data.userId,
            callerName: client.data.user?.name,
        });
    }
    handleCallAnswer(data, client) {
        client.to(`conversation:${data.conversationId}`).emit('call:answer', {
            conversationId: data.conversationId,
            answer: data.answer,
            responderId: client.data.userId,
        });
    }
    handleIceCandidate(data, client) {
        client.to(`conversation:${data.conversationId}`).emit('call:ice-candidate', {
            conversationId: data.conversationId,
            candidate: data.candidate,
            senderId: client.data.userId,
        });
    }
    handleCallEnd(data, client) {
        client.to(`conversation:${data.conversationId}`).emit('call:end', {
            conversationId: data.conversationId,
            enderId: client.data.userId,
        });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:conversation'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:conversation'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:start'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:stop'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:offer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:answer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:ice-candidate'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:end'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallEnd", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map