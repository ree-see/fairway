import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import { User, LoginRequest, RegisterRequest, ApiError } from '../types/api';

interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (userData: RegisterRequest) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  updateUserData: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  handleAuthFailure: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('access_token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid by fetching fresh user data
        try {
          await refreshUser();
        } catch (error) {
          // Token might be expired but refresh token could still be valid
          console.log('Token validation failed, but user will remain logged in for retry attempts');
          // Don't clear stored auth immediately - let the API service handle token refresh
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStoredAuth = async () => {
    await AsyncStorage.multiRemove(['user', 'access_token', 'refresh_token']);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await ApiService.getProfile();
      if (response.success && response.data) {
        const updatedUser = response.data.user;
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const credentials: LoginRequest = { email, password };
      const response = await ApiService.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { 
          success: true, 
          user: response.data.user,
          message: response.message 
        };
      } else {
        return { 
          success: false, 
          message: response.error || response.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      const apiError = error as ApiError;
      return { 
        success: false, 
        message: apiError.message || 'Network error occurred' 
      };
    }
  };

  const register = async (userData: RegisterRequest): Promise<AuthResult> => {
    try {
      const response = await ApiService.register(userData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { 
          success: true, 
          user: response.data.user,
          message: response.message 
        };
      } else {
        return { 
          success: false, 
          message: response.error || response.message || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const apiError = error as ApiError;
      return { 
        success: false, 
        message: apiError.message || 'Network error occurred' 
      };
    }
  };

  const logout = async (): Promise<AuthResult> => {
    try {
      await ApiService.logout();
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API logout fails, clear local state
      await clearStoredAuth();
      const apiError = error as ApiError;
      return { 
        success: false, 
        message: apiError.message || 'Logout failed' 
      };
    }
  };

  const updateUserData = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await ApiService.updateProfile(userData);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error || 'Failed to update profile' 
      };
    } catch (error: any) {
      const apiError = error as ApiError;
      return { 
        success: false, 
        error: apiError.message || 'Failed to update profile' 
      };
    }
  };

  const handleAuthFailure = async (): Promise<void> => {
    console.log('Authentication failed completely, clearing stored auth');
    await clearStoredAuth();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUser, updateUserData, handleAuthFailure }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};