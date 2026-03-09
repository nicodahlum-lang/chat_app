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
var ConversationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConversationsService = ConversationsService_1 = class ConversationsService {
    prisma;
    logger = new common_1.Logger(ConversationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllConversations(userId) {
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
            const conversations = await Promise.all(participations.map(async (participation) => {
                const conversation = participation.conversation;
                const lastMessage = conversation.messages[0];
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
            }));
            return { conversations };
        }
        catch (error) {
            this.logger.error('Get all conversations error', error);
            throw error;
        }
    }
    async createOneOnOne(userId, createOneOnOneDto) {
        try {
            const { participantId } = createOneOnOneDto;
            if (participantId === userId) {
                throw new common_1.BadRequestException('Cannot create conversation with yourself');
            }
            const participant = await this.prisma.user.findUnique({
                where: { id: participantId },
            });
            if (!participant) {
                throw new common_1.NotFoundException('Participant not found');
            }
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
        }
        catch (error) {
            this.logger.error('Create one-on-one conversation error', error);
            throw error;
        }
    }
    async createGroup(userId, createGroupDto) {
        try {
            const { name, participantIds, avatarUrl } = createGroupDto;
            const participants = await this.prisma.user.findMany({
                where: { id: { in: participantIds } },
            });
            if (participants.length !== participantIds.length) {
                throw new common_1.BadRequestException('Some participants not found');
            }
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
        }
        catch (error) {
            this.logger.error('Create group conversation error', error);
            throw error;
        }
    }
    async getConversationDetails(conversationId, userId) {
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
                throw new common_1.NotFoundException('Conversation not found');
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
        }
        catch (error) {
            this.logger.error('Get conversation details error', error);
            throw error;
        }
    }
    async addParticipants(conversationId, userId, addParticipantsDto) {
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
            if (conversation.type !== 'GROUP') {
                throw new common_1.ForbiddenException('Can only add participants to group conversations');
            }
            const participants = await this.prisma.user.findMany({
                where: { id: { in: addParticipantsDto.participantIds } },
            });
            if (participants.length !== addParticipantsDto.participantIds.length) {
                throw new common_1.BadRequestException('Some participants not found');
            }
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
        }
        catch (error) {
            this.logger.error('Add participants error', error);
            throw error;
        }
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = ConversationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map