import { ConversationsService } from './conversations.service';
import { CreateOneOnOneDto } from './dto/create-one-on-one.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    getAllConversations(req: any): Promise<{
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
    createOneOnOne(createOneOnOneDto: CreateOneOnOneDto, req: any): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ConversationType;
        participants: {
            id: string;
            name: string;
            avatarUrl: string | null;
        }[];
        createdAt: string;
    }>;
    createGroup(createGroupDto: CreateGroupDto, req: any): Promise<{
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
    getConversationDetails(id: string, req: any): Promise<{
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
    addParticipants(id: string, addParticipantsDto: AddParticipantsDto, req: any): Promise<{
        success: boolean;
        participants: {
            id: string;
            name: string;
            avatarUrl: string | null;
        }[];
    }>;
}
