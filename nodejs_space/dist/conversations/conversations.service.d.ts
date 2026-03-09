import { PrismaService } from '../prisma/prisma.service';
import { CreateOneOnOneDto } from './dto/create-one-on-one.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
export declare class ConversationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getAllConversations(userId: string): Promise<{
        conversations: {
            id: string;
            type: import("@prisma/client").$Enums.ConversationType;
            name: string | null;
            avatarUrl: string | null;
            participants: {
                id: string;
                name: string;
                avatarUrl: string | null;
            }[];
            lastMessage: {
                content: string | null;
                createdAt: string;
                senderId: string;
            } | null;
            unreadCount: number;
            createdAt: string;
        }[];
    }>;
    createOneOnOne(userId: string, createOneOnOneDto: CreateOneOnOneDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ConversationType;
        participants: {
            id: string;
            name: string;
            avatarUrl: string | null;
        }[];
        createdAt: string;
    }>;
    createGroup(userId: string, createGroupDto: CreateGroupDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ConversationType;
        name: string | null;
        avatarUrl: string | null;
        participants: {
            id: string;
            name: string;
            avatarUrl: string | null;
        }[];
        createdAt: string;
    }>;
    getConversationDetails(conversationId: string, userId: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ConversationType;
        name: string | null;
        avatarUrl: string | null;
        participants: {
            id: string;
            name: string;
            avatarUrl: string | null;
            joinedAt: string;
        }[];
        createdAt: string;
    }>;
    addParticipants(conversationId: string, userId: string, addParticipantsDto: AddParticipantsDto): Promise<{
        success: boolean;
        participants: {
            id: string;
            name: string;
            avatarUrl: string | null;
        }[];
    }>;
}
