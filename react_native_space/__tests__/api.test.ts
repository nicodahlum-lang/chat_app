import type { SignupDto, LoginDto } from '../src/types';

// Mock axios module before importing
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
  },
}));

// Mock storage
jest.mock('../src/utils/storage', () => ({
  storage: {
    getToken: jest.fn().mockResolvedValue(null),
    setToken: jest.fn().mockResolvedValue(undefined),
    removeToken: jest.fn().mockResolvedValue(undefined),
  },
}));

import { apiService } from '../src/services/api';

describe('API Service', () => {
  describe('Auth endpoints', () => {
    it('should have signup method', () => {
      expect(apiService?.signup).toBeDefined();
      expect(typeof apiService?.signup).toBe('function');
    });

    it('should have login method', () => {
      expect(apiService?.login).toBeDefined();
      expect(typeof apiService?.login).toBe('function');
    });

    it('should have getProfile method', () => {
      expect(apiService?.getProfile).toBeDefined();
      expect(typeof apiService?.getProfile).toBe('function');
    });
  });

  describe('User endpoints', () => {
    it('should have searchUsers method', () => {
      expect(apiService?.searchUsers).toBeDefined();
      expect(typeof apiService?.searchUsers).toBe('function');
    });

    it('should have updateProfile method', () => {
      expect(apiService?.updateProfile).toBeDefined();
      expect(typeof apiService?.updateProfile).toBe('function');
    });
  });

  describe('Conversation endpoints', () => {
    it('should have getConversations method', () => {
      expect(apiService?.getConversations).toBeDefined();
      expect(typeof apiService?.getConversations).toBe('function');
    });

    it('should have createOneOnOne method', () => {
      expect(apiService?.createOneOnOne).toBeDefined();
      expect(typeof apiService?.createOneOnOne).toBe('function');
    });

    it('should have createGroup method', () => {
      expect(apiService?.createGroup).toBeDefined();
      expect(typeof apiService?.createGroup).toBe('function');
    });
  });

  describe('Message endpoints', () => {
    it('should have getMessages method', () => {
      expect(apiService?.getMessages).toBeDefined();
      expect(typeof apiService?.getMessages).toBe('function');
    });

    it('should have sendMessage method', () => {
      expect(apiService?.sendMessage).toBeDefined();
      expect(typeof apiService?.sendMessage).toBe('function');
    });

    it('should have viewMessage method', () => {
      expect(apiService?.viewMessage).toBeDefined();
      expect(typeof apiService?.viewMessage).toBe('function');
    });
  });

  describe('Upload endpoint', () => {
    it('should have uploadImage method', () => {
      expect(apiService?.uploadImage).toBeDefined();
      expect(typeof apiService?.uploadImage).toBe('function');
    });
  });
});
