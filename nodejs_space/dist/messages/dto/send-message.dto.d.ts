export declare class SendMessageDto {
    content?: string;
    messageType: 'TEXT' | 'IMAGE' | 'AUDIO';
    imageUrl?: string;
    audioUrl?: string;
    isDisappearing?: boolean;
    disappearDurationSeconds?: number;
    replyToId?: string;
}
