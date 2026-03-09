import { io, Socket } from 'socket.io-client';
import type { MessageNewEvent, TypingEvent, MessageViewedEvent, ConversationUpdatedEvent, MessageDeletedEvent, UserOnlineEvent, UserOfflineEvent, MessageReactionEvent } from '../types';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.73:3000').replace(/\/$/, '');

export class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    // Backend uses namespace '/chat', not a custom path
    this.socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      query: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Join/Leave conversation rooms
  joinConversation(conversationId: string) {
    this.socket?.emit('join:conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave:conversation', { conversationId });
  }

  // Typing indicators
  startTyping(conversationId: string) {
    this.socket?.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  // Event listeners
  onMessageNew(callback: (data: MessageNewEvent) => void) {
    this.socket?.on('message:new', callback);
  }

  onTypingStart(callback: (data: TypingEvent) => void) {
    this.socket?.on('typing:start', callback);
  }

  onTypingStop(callback: (data: TypingEvent) => void) {
    this.socket?.on('typing:stop', callback);
  }

  onMessageViewed(callback: (data: MessageViewedEvent) => void) {
    this.socket?.on('message:viewed', callback);
  }

  onMessageReaction(callback: (data: MessageReactionEvent) => void) {
    this.socket?.on('message:reaction', callback);
  }

  onMessageDeleted(callback: (data: MessageDeletedEvent) => void) {
    this.socket?.on('message:deleted', callback);
  }

  // WebRTC Signaling
  sendCallOffer(conversationId: string, offer: any) {
    if (this.socket?.connected) {
      this.socket.emit('call:offer', { conversationId, offer });
    }
  }

  sendCallAnswer(conversationId: string, answer: any) {
    if (this.socket?.connected) {
      this.socket.emit('call:answer', { conversationId, answer });
    }
  }

  sendIceCandidate(conversationId: string, candidate: any) {
    if (this.socket?.connected) {
      this.socket.emit('call:ice-candidate', { conversationId, candidate });
    }
  }

  endCall(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('call:end', { conversationId });
    }
  }

  onCallOffer(callback: (data: { conversationId: string; offer: any; callerId: string; callerName: string }) => void) {
    this.socket?.on('call:offer', callback);
    return () => { this.socket?.off('call:offer', callback); };
  }

  onCallAnswer(callback: (data: { conversationId: string; answer: any; responderId: string }) => void) {
    this.socket?.on('call:answer', callback);
    return () => { this.socket?.off('call:answer', callback); };
  }

  onIceCandidate(callback: (data: { conversationId: string; candidate: any; senderId: string }) => void) {
    this.socket?.on('call:ice-candidate', callback);
    return () => { this.socket?.off('call:ice-candidate', callback); };
  }

  onCallEnd(callback: (data: { conversationId: string; enderId: string }) => void) {
    this.socket?.on('call:end', callback);
    return () => { this.socket?.off('call:end', callback); };
  }

  onUserOnline(callback: (data: UserOnlineEvent) => void) {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback: (data: UserOfflineEvent) => void) {
    this.socket?.on('user:offline', callback);
  }

  onConversationUpdated(callback: (data: ConversationUpdatedEvent) => void) {
    this.socket?.on('conversation:updated', callback);
  }

  // Remove listeners
  offMessageNew() {
    this.socket?.off('message:new');
  }

  offTypingStart() {
    this.socket?.off('typing:start');
  }

  offTypingStop() {
    this.socket?.off('typing:stop');
  }

  offMessageViewed() {
    this.socket?.off('message:viewed');
  }

  offMessageDeleted() {
    this.socket?.off('message:deleted');
  }

  offMessageReaction() {
    this.socket?.off('message:reaction');
  }

  offUserOnline() {
    this.socket?.off('user:online');
  }

  offUserOffline() {
    this.socket?.off('user:offline');
  }

  offConversationUpdated() {
    this.socket?.off('conversation:updated');
  }
}

export const socketService = new SocketService();
