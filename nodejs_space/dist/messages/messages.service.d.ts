import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
export declare class MessagesService {
    private readonly prisma;
    private readonly chatGateway;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, chatGateway: ChatGateway, notificationsService: NotificationsService);
    getMessages(conversationId: string, userId: string, limit?: number, before?: string): Promise<{
        messages: {
            id: any;
            senderId: any;
            senderName: any;
            senderAvatar: any;
            content: any;
            messageType: any;
            imageUrl: any;
            audioUrl: any;
            isDisappearing: any;
            disappearDurationSeconds: any;
            viewedBy: any;
            createdAt: any;
            isDeleted: any;
            replyToId: any;
            reactions: any;
            quotedMessage: {
                id: any;
                senderId: any;
                senderName: any;
                content: any;
                messageType: any;
            } | undefined;
            linkMetadata: any;
        }[];
        hasMore: boolean;
    }>;
    sendMessage(conversationId: string, userId: string, sendMessageDto: SendMessageDto): Promise<{
        id: any;
        senderId: any;
        senderName: any;
        senderAvatar: any;
        content: any;
        messageType: any;
        imageUrl: any;
        audioUrl: any;
        isDisappearing: any;
        disappearDurationSeconds: any;
        replyToId: any;
        reactions: any;
        quotedMessage: {
            id: any;
            senderId: any;
            senderName: any;
            content: any;
            messageType: any;
        } | undefined;
        createdAt: any;
        linkMetadata: any;
    }>;
    viewMessage(messageId: string, userId: string): Promise<{
        success: boolean;
        viewedAt: string;
        shouldDisappear: boolean;
    }>;
    markConversationAsRead(conversationId: string, userId: string): Promise<{
        success: boolean;
        lastReadAt: string;
    }>;
    deleteMessage(messageId: string, userId: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
    reactToMessage(messageId: string, userId: string, emoji: string): Promise<{
        success: boolean;
        emoji: string | null;
    }>;
    private getLinkMetadata;
}
