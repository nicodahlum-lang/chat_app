import { AuthContext } from '../src/contexts/AuthContext';

// Mock dependencies
jest.mock('../src/services/api', () => ({
  apiService: {
    getProfile: jest.fn().mockRejectedValue(new Error('Not authenticated')),
    login: jest.fn(),
    signup: jest.fn(),
  },
}));

jest.mock('../src/services/socket', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

jest.mock('../src/utils/storage', () => ({
  storage: {
    getToken: jest.fn().mockResolvedValue(null),
    setToken: jest.fn().mockResolvedValue(undefined),
    removeToken: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('AuthContext', () => {
  it('should have default context values', () => {
    expect(AuthContext).toBeDefined();
    expect(AuthContext?._currentValue).toBeDefined();
  });

  it('should have required methods in default context', () => {
    const defaultContext = AuthContext?._currentValue;
    expect(defaultContext?.login).toBeDefined();
    expect(defaultContext?.signup).toBeDefined();
    expect(defaultContext?.logout).toBeDefined();
    expect(defaultContext?.updateUser).toBeDefined();
  });

  it('should have state properties in default context', () => {
    const defaultContext = AuthContext?._currentValue;
    expect(typeof defaultContext?.isLoading).toBe('boolean');
    expect(typeof defaultContext?.isAuthenticated).toBe('boolean');
  });
});
