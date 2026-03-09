import { storage } from '../src/utils/storage';

describe('Storage Utility', () => {
  it('should have setToken method', () => {
    expect(storage?.setToken).toBeDefined();
    expect(typeof storage?.setToken).toBe('function');
  });

  it('should have getToken method', () => {
    expect(storage?.getToken).toBeDefined();
    expect(typeof storage?.getToken).toBe('function');
  });

  it('should have removeToken method', () => {
    expect(storage?.removeToken).toBeDefined();
    expect(typeof storage?.removeToken).toBe('function');
  });

  it('should handle token operations safely', async () => {
    // Test set and get
    await expect(storage?.setToken?.('test-token')).resolves.not.toThrow();
    
    // Test remove
    await expect(storage?.removeToken?.()).resolves.not.toThrow();
  });
});
