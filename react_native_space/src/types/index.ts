// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  themeBackground?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Conversation types
export type ConversationType = 'ONE_ON_ONE' | 'GROUP';

export interface ConversationParticipant {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface LastMessage {
  content?: string | null;
  createdAt: string;
  senderId: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  avatarUrl?: string | null;
  participants: ConversationParticipant[];
  lastMessage?: LastMessage | null;
  unreadCount: number;
  createdAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

// Message types
export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO';

export interface MessageView {
  userId: string;
  viewedAt: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface QuotedMessage {
  id: string;
  senderId: string;
  senderName: string;
  content?: string | null;
  messageType: MessageType;
}

export interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface MessageReactionEvent {
  conversationId: string;
  messageId: string;
  userId: string;
  emoji: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  content?: string | null;
  messageType: MessageType;
  imageUrl?: string | null;
  audioUrl?: string | null;
  isDisappearing: boolean;
  isDeleted?: boolean;
  replyToId?: string;
  quotedMessage?: QuotedMessage | null;
  viewedBy: MessageView[];
  reactions?: MessageReaction[];
  disappearDurationSeconds?: number | null;
  linkMetadata?: LinkMetadata | null;
  createdAt: string;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

// DTO types (match backend exactly)
export interface SignupDto {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SendMessageDto {
  content?: string;
  messageType: MessageType;
  imageUrl?: string;
  audioUrl?: string;
  isDisappearing?: boolean;
  disappearDurationSeconds?: number;
  replyToId?: string;
}

export interface CreateOneOnOneDto {
  participantId: string;
}

export interface CreateGroupDto {
  name: string;
  participantIds: string[];
  avatarUrl?: string;
}

export interface UpdateProfileDto {
  name?: string;
  avatarUrl?: string;
}

export interface UploadResponse {
  url: string;
}

// WebSocket event types
export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName?: string;
}

export interface MessageNewEvent {
  conversationId: string;
  message: Message;
}

export interface MessageViewedEvent {
  messageId: string;
  userId: string;
  viewedAt: string;
}

export interface MessageDeletedEvent {
  conversationId: string;
  messageId: string;
}

export interface UserOnlineEvent {
  userId: string;
}

export interface UserOfflineEvent {
  userId: string;
  lastSeen?: string;
}

export interface ConversationUpdatedEvent {
  conversationId: string;
  updates: any;
}
