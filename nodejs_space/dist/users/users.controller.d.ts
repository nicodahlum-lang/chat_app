import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    searchUsers(query: string, req: any): Promise<{
        users: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        }[];
    }>;
    getOnlineUsers(): Promise<{
        onlineUsers: string[];
    }>;
    updateProfile(updateProfileDto: UpdateProfileDto, req: any): Promise<{
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
    }>;
    updatePushToken(token: string, req: any): Promise<{
        success: boolean;
    }>;
    updatePublicKey(publicKey: string, req: any): Promise<{
        success: boolean;
    }>;
    getPublicKey(id: string): Promise<{
        publicKey: string | null;
    }>;
    updateBackground(backgroundUrl: string | null, req: any): Promise<{
        success: boolean;
        backgroundUrl: any;
    }>;
}
