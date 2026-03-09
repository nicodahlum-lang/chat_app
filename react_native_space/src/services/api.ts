import axios, { AxiosError } from 'axios';
import type {
  AuthResponse,
  SignupDto,
  LoginDto,
  User,
  ConversationsResponse,
  CreateOneOnOneDto,
  CreateGroupDto,
  UpdateProfileDto,
  MessagesResponse,
  SendMessageDto,
  UploadResponse,
} from '../types';
import { storage } from '../utils/storage';

// Use environment variable or fallback to preview URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.73:3000';
console.log('Using API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error?.response?.status === 401) {
      // Token expired or invalid - clear it
      await storage.removeToken();
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth endpoints
  async signup(data: SignupDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response?.data ?? { token: '', user: { id: '', email: '', name: '' } };
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response?.data ?? { token: '', user: { id: '', email: '', name: '' } };
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response?.data ?? { id: '', email: '', name: '' };
  },

  // User endpoints
  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get<any>('/users/search', { params: { query } });
    return response?.data?.users ?? response?.data ?? [];
  },

  async updateProfile(data: UpdateProfileDto): Promise<User> {
    const response = await api.put<User>('/users/profile', data);
    return response?.data ?? { id: '', email: '', name: '' };
  },

  // Conversation endpoints
  async getConversations(): Promise<ConversationsResponse> {
    const response = await api.get<ConversationsResponse>('/conversations');
    return response?.data ?? { conversations: [] };
  },

  async createOneOnOne(data: CreateOneOnOneDto) {
    const response = await api.post('/conversations/one-on-one', data);
    return response?.data ?? null;
  },

  async createGroup(data: CreateGroupDto) {
    const response = await api.post('/conversations/group', data);
    return response?.data ?? null;
  },

  async getConversationDetails(id: string) {
    const response = await api.get(`/conversations/${id}`);
    return response?.data ?? null;
  },

  async addParticipants(conversationId: string, participantIds: string[]) {
    const response = await api.post(`/conversations/${conversationId}/participants`, { participantIds });
    return response?.data ?? null;
  },

  // Message endpoints
  async getMessages(conversationId: string, limit?: number, before?: string): Promise<MessagesResponse> {
    const response = await api.get<MessagesResponse>(`/conversations/${conversationId}/messages`, {
      params: { limit, before },
    });
    return response?.data ?? { messages: [], hasMore: false };
  },

  async sendMessage(conversationId: string, data: SendMessageDto) {
    const response = await api.post(`/conversations/${conversationId}/messages`, data);
    return response?.data ?? null;
  },

  async deleteMessage(messageId: string) {
    const response = await api.delete(`/messages/${messageId}`);
    return response?.data ?? null;
  },

  async getOnlineUsers(): Promise<{ onlineUsers: string[] }> {
    const response = await api.get('/users/online');
    return response?.data ?? { onlineUsers: [] };
  },

  async viewMessage(messageId: string) {
    const response = await api.post(`/messages/${messageId}/view`);
    return response?.data ?? null;
  },

  async reactToMessage(messageId: string, emoji: string) {
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    return response?.data ?? null;
  },

  async updatePushToken(token: string) {
    const response = await api.put('/users/push-token', { token });
    return response?.data ?? null;
  },

  async updatePublicKey(publicKey: string) {
    const response = await api.put('/users/public-key', { publicKey });
    return response?.data ?? null;
  },

  async getPublicKey(userId: string) {
    const response = await api.get(`/users/${userId}/public-key`);
    return response?.data?.publicKey ?? null;
  },

  async markConversationAsRead(conversationId: string) {
    const response = await api.put(`/conversations/${conversationId}/read`);
    return response?.data ?? null;
  },

  // Upload endpoint
  async uploadImage(file: FormData): Promise<UploadResponse> {
    const response = await api.post<UploadResponse>('/upload', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    return response?.data ?? { url: '' };
  },

  async uploadAudio(file: FormData): Promise<UploadResponse> {
    const response = await api.post<UploadResponse>('/upload/audio', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
    return response?.data ?? { url: '' };
  },

  async updateBackground(backgroundUrl: string | null) {
    const response = await api.put('/users/background', { backgroundUrl });
    return response?.data ?? null;
  },
};

export default api;
