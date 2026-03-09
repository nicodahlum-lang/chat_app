import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, SignupDto, LoginDto } from '../types';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { socketService } from '../services/socket';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { cryptoService } from '../services/crypto';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginDto) => Promise<void>;
  signup: (data: SignupDto) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => { },
  signup: async () => { },
  logout: async () => { },
  updateUser: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = await storage.getToken();
      if (token) {
        const userData = await apiService.getProfile();
        setUser(userData ?? null);
        socketService.connect(token);

        try {
          const deviceToken = await registerForPushNotificationsAsync();
          if (deviceToken) await apiService.updatePushToken(deviceToken);
        } catch (e) {
          console.log('Push setup failed on load:', e);
        }

        try {
          const keysLoaded = await cryptoService.loadKeys();
          if (!keysLoaded) {
            const pubKey = await cryptoService.generateKeyPair();
            if (pubKey) await apiService.updatePublicKey(pubKey);
          }
        } catch (e) {
          console.log('Crypto setup failed on load:', e);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      await storage.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (data: LoginDto) => {
    try {
      const response = await apiService.login(data);
      if (response?.token && response?.user) {
        await storage.setToken(response.token);
        setUser(response.user);
        socketService.connect(response.token);

        try {
          const deviceToken = await registerForPushNotificationsAsync();
          if (deviceToken) await apiService.updatePushToken(deviceToken);
        } catch (e) {
          console.log('Push setup failed on login:', e);
        }

        try {
          const keysLoaded = await cryptoService.loadKeys();
          if (!keysLoaded) {
            const pubKey = await cryptoService.generateKeyPair();
            if (pubKey) await apiService.updatePublicKey(pubKey);
          }
        } catch (e) {
          console.log('Crypto setup failed on login:', e);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const signup = useCallback(async (data: SignupDto) => {
    try {
      const response = await apiService.signup(data);
      if (response?.token && response?.user) {
        await storage.setToken(response.token);
        setUser(response.user);
        socketService.connect(response.token);

        try {
          const deviceToken = await registerForPushNotificationsAsync();
          if (deviceToken) await apiService.updatePushToken(deviceToken);
        } catch (e) {
          console.log('Push setup failed on signup:', e);
        }

        try {
          const keysLoaded = await cryptoService.loadKeys();
          if (!keysLoaded) {
            const pubKey = await cryptoService.generateKeyPair();
            if (pubKey) await apiService.updatePublicKey(pubKey);
          }
        } catch (e) {
          console.log('Crypto setup failed on signup:', e);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await storage.removeToken();
      socketService.disconnect();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
