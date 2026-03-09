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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
let UsersService = UsersService_1 = class UsersService {
    prisma;
    chatGateway;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma, chatGateway) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
    }
    async searchUsers(query, currentUserId) {
        try {
            const users = await this.prisma.user.findMany({
                where: {
                    AND: [
                        {
                            id: {
                                not: currentUserId,
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
        }
        catch (error) {
            this.logger.error('Search users error', error);
            throw error;
        }
    }
    async updateProfile(userId, updateProfileDto) {
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
        }
        catch (error) {
            this.logger.error('Update profile error', error);
            throw error;
        }
    }
    async getOnlineUsers() {
        try {
            const onlineUserIds = this.chatGateway.getOnlineUsers();
            return { onlineUsers: onlineUserIds };
        }
        catch (error) {
            this.logger.error('Error getting online users', error);
            throw error;
        }
    }
    async updatePushToken(userId, token) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { pushtoken: token },
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Error updating push token for ${userId}`, error);
            throw error;
        }
    }
    async updatePublicKey(userId, publicKey) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { publickey: publicKey },
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Error updating public key for ${userId}`, error);
            throw error;
        }
    }
    async getPublicKey(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { publickey: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return { publicKey: user.publickey };
        }
        catch (error) {
            this.logger.error(`Error fetching public key for ${userId}`, error);
            throw error;
        }
    }
    async updateBackground(userId, backgroundUrl) {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: { themebackground: backgroundUrl },
                select: {
                    id: true,
                    themebackground: true,
                },
            });
            return { success: true, backgroundUrl: user.themebackground };
        }
        catch (error) {
            this.logger.error(`Error updating background for ${userId}`, error);
            throw error;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway])
], UsersService);
//# sourceMappingURL=users.service.js.map