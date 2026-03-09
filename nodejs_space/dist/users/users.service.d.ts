import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChatGateway } from '../chat/chat.gateway';
export declare class UsersService {
    private readonly prisma;
    private readonly chatGateway;
    private readonly logger;
    constructor(prisma: PrismaService, chatGateway: ChatGateway);
    searchUsers(query: string, currentUserId: string): Promise<{
        users: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        }[];
    }>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
    }>;
    getOnlineUsers(): Promise<{
        onlineUsers: string[];
    }>;
    updatePushToken(userId: string, token: string): Promise<{
        success: boolean;
    }>;
    updatePublicKey(userId: string, publicKey: string): Promise<{
        success: boolean;
    }>;
    getPublicKey(userId: string): Promise<{
        publicKey: string | null;
    }>;
    updateBackground(userId: string, backgroundUrl: string | null): Promise<{
        success: boolean;
        backgroundUrl: any;
    }>;
}
