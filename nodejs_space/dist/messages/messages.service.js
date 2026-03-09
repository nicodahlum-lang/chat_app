"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MessagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
let MessagesService = MessagesService_1 = class MessagesService {
    prisma;
    chatGateway;
    notificationsService;
    logger = new common_1.Logger(MessagesService_1.name);
    constructor(prisma, chatGateway, notificationsService) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
        this.notificationsService = notificationsService;
    }
    async getMessages(conversationId, userId, limit = 50, before) {
        try {
            const participation = await this.prisma.conversationparticipant.findFirst({
                where: {
                    conversationid: conversationId,
                    userid: userId,
                },
            });
            if (!participation) {
                throw new common_1.ForbiddenException('You are not a participant of this conversation');
            }
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId },
            });
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            const whereCondition = {
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
                take: limit + 1,
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
                messages: messagesToReturn.map((message) => ({
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
                    viewedBy: (message.views || []).map((view) => ({
                        userId: view.userid,
                        viewedAt: view.viewedat.toISOString(),
                    })),
                    createdAt: message.createdat.toISOString(),
                    isDeleted: message.isdeleted,
                    replyToId: message.replytoid,
                    reactions: (message.reactions || []).map((r) => ({
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
        }
        catch (error) {
            this.logger.error('Get messages error', error);
            throw error;
        }
    }
    async sendMessage(conversationId, userId, sendMessageDto) {
        try {
            const participation = await this.prisma.conversationparticipant.findFirst({
                where: {
                    conversationid: conversationId,
                    userid: userId,
                },
            });
            if (!participation) {
                throw new common_1.ForbiddenException('You are not a participant of this conversation');
            }
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId },
            });
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            const linkMetadata = await this.getLinkMetadata(sendMessageDto.content);
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
                    linkmetadata: linkMetadata,
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
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedat: new Date() },
            });
            this.logger.log(`Message sent in conversation ${conversationId} by user ${userId}`);
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
                        this.notificationsService.sendPushNotification(p.user.pushtoken, message.sender.name, body || 'New message', { conversationId, messageId: message.id }).catch(e => this.logger.error('Push error', e));
                    }
                }
            }).catch(e => this.logger.error('Error fetching participants for push', e));
            const messageAsAny = message;
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
                reactions: (messageAsAny.reactions || []).map((r) => ({
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
        }
        catch (error) {
            this.logger.error('Send message error', error);
            throw error;
        }
    }
    async viewMessage(messageId, userId) {
        try {
            const message = await this.prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    views: true,
                },
            });
            if (!message) {
                throw new common_1.NotFoundException('Message not found');
            }
            const participation = await this.prisma.conversationparticipant.findFirst({
                where: {
                    conversationid: message.conversationid,
                    userid: userId,
                },
            });
            if (!participation) {
                throw new common_1.ForbiddenException('You are not a participant of this conversation');
            }
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
        }
        catch (error) {
            this.logger.error('View message error', error);
            throw error;
        }
    }
    async markConversationAsRead(conversationId, userId) {
        try {
            const participation = await this.prisma.conversationparticipant.findFirst({
                where: {
                    conversationid: conversationId,
                    userid: userId,
                },
            });
            if (!participation) {
                throw new common_1.ForbiddenException('You are not a participant of this conversation');
            }
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId },
            });
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            const updated = await this.prisma.conversationparticipant.update({
                where: { id: participation.id },
                data: { lastreadat: new Date() },
            });
            this.logger.log(`Conversation ${conversationId} marked as read by user ${userId}`);
            return {
                success: true,
                lastReadAt: updated.lastreadat.toISOString(),
            };
        }
        catch (error) {
            this.logger.error('Mark conversation as read error', error);
            throw error;
        }
    }
    async deleteMessage(messageId, userId) {
        try {
            const message = await this.prisma.message.findUnique({
                where: { id: messageId },
            });
            if (!message) {
                throw new common_1.NotFoundException('Message not found');
            }
            if (message.senderid !== userId) {
                throw new common_1.ForbiddenException('You can only delete your own messages');
            }
            await this.prisma.message.update({
                where: { id: messageId },
                data: {
                    isdeleted: true,
                    content: null,
                    imageurl: null,
                    audiourl: null,
                    messagetype: 'TEXT',
                },
            });
            this.chatGateway.emitMessageDeleted(message.conversationid, messageId);
            this.logger.log(`Message ${messageId} deleted by user ${userId}`);
            return {
                success: true,
                messageId,
            };
        }
        catch (error) {
            this.logger.error('Delete message error', error);
            throw error;
        }
    }
    async reactToMessage(messageId, userId, emoji) {
        try {
            const message = await this.prisma.message.findUnique({
                where: { id: messageId },
            });
            if (!message) {
                throw new common_1.NotFoundException('Message not found');
            }
            const existingReaction = await this.prisma.messagereaction.findUnique({
                where: {
                    messageid_userid: {
                        messageid: messageId,
                        userid: userId,
                    },
                },
            });
            let finalEmoji = null;
            if (existingReaction) {
                if (existingReaction.emoji === emoji) {
                    await this.prisma.messagereaction.delete({
                        where: { id: existingReaction.id },
                    });
                }
                else {
                    await this.prisma.messagereaction.update({
                        where: { id: existingReaction.id },
                        data: { emoji },
                    });
                    finalEmoji = emoji;
                }
            }
            else {
                await this.prisma.messagereaction.create({
                    data: {
                        messageid: messageId,
                        userid: userId,
                        emoji,
                    },
                });
                finalEmoji = emoji;
            }
            this.chatGateway.emitMessageReaction(message.conversationid, messageId, userId, finalEmoji);
            return {
                success: true,
                emoji: finalEmoji,
            };
        }
        catch (error) {
            this.logger.error('React to message error', error);
            throw error;
        }
    }
    async getLinkMetadata(content) {
        if (!content)
            return null;
        const urlRegex = /(https?:\/\/[^\s]+)/;
        const match = content.match(urlRegex);
        if (!match)
            return null;
        const url = match[0];
        try {
            const { data } = await axios_1.default.get(url, {
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
        }
        catch (error) {
            this.logger.error(`Error fetching metadata for ${url}: ${error.message}`);
            return null;
        }
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = MessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway,
        notifications_service_1.NotificationsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map