import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (userData: any) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  isLoading: boolean;
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
      const storedToken = await AsyncStorage.getItem('auth_token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      // For now, use mock authentication
      const mockUser: User = {
        id: '1',
        email: email,
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890'
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('auth_token', 'mock_token_123');
      
      setUser(mockUser);
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const register = async (userData: any): Promise<AuthResult> => {
    try {
      // Mock registration
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone
      };

      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      await AsyncStorage.setItem('auth_token', 'mock_token_123');
      
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  };

  const logout = async (): Promise<AuthResult> => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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