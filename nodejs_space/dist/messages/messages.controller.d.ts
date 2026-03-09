import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getMessages(conversationId: string, limit?: string, before?: string, req?: any): Promise<{
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
    sendMessage(conversationId: string, sendMessageDto: SendMessageDto, req: any): Promise<{
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
    viewMessage(messageId: string, req: any): Promise<{
        success: boolean;
        viewedAt: string;
        shouldDisappear: boolean;
    }>;
    markConversationAsRead(conversationId: string, req: any): Promise<{
        success: boolean;
        lastReadAt: string;
    }>;
    deleteMessage(messageId: string, req: any): Promise<{
        success: boolean;
        messageId: string;
    }>;
    reactToMessage(messageId: string, emoji: string, req: any): Promise<{
        success: boolean;
        emoji: string | null;
    }>;
}
