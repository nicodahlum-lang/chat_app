import { SocketService } from '../src/services/socket';

describe('Socket Service', () => {
  let socketService: SocketService;

  beforeEach(() => {
    socketService = new SocketService();
  });

  it('should create socket service instance', () => {
    expect(socketService).toBeDefined();
  });

  it('should have connect method', () => {
    expect(socketService?.connect).toBeDefined();
    expect(typeof socketService?.connect).toBe('function');
  });

  it('should have disconnect method', () => {
    expect(socketService?.disconnect).toBeDefined();
    expect(typeof socketService?.disconnect).toBe('function');
  });

  it('should have isConnected method', () => {
    expect(socketService?.isConnected).toBeDefined();
    expect(typeof socketService?.isConnected).toBe('function');
  });

  it('should have joinConversation method', () => {
    expect(socketService?.joinConversation).toBeDefined();
    expect(typeof socketService?.joinConversation).toBe('function');
  });

  it('should have leaveConversation method', () => {
    expect(socketService?.leaveConversation).toBeDefined();
    expect(typeof socketService?.leaveConversation).toBe('function');
  });

  it('should have typing methods', () => {
    expect(socketService?.startTyping).toBeDefined();
    expect(socketService?.stopTyping).toBeDefined();
    expect(typeof socketService?.startTyping).toBe('function');
    expect(typeof socketService?.stopTyping).toBe('function');
  });

  it('should have event listener methods', () => {
    expect(socketService?.onMessageNew).toBeDefined();
    expect(socketService?.onTypingStart).toBeDefined();
    expect(socketService?.onTypingStop).toBeDefined();
    expect(socketService?.onMessageViewed).toBeDefined();
  });

  it('should initially not be connected', () => {
    expect(socketService?.isConnected?.()).toBe(false);
  });

  it('should handle disconnect safely', () => {
    expect(() => socketService?.disconnect?.()).not.toThrow();
  });
});
