import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../useAuth';
import ApiService from '../../services/ApiService';

jest.mock('../../services/ApiService');
jest.mock('@react-native-async-storage/async-storage');

const mockedApiService = ApiService as jest.Mocked<typeof ApiService>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    mockedAsyncStorage.getItem.mockImplementation(() => Promise.resolve(null));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should load existing user from AsyncStorage', async () => {
    const mockUser = { id: '1', email: 'test@example.com', first_name: 'Test' };
    mockedAsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return Promise.resolve(JSON.stringify(mockUser));
      if (key === 'access_token') return Promise.resolve('mock-token');
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', first_name: 'Test' };
    const mockAuthResponse = {
      success: true,
      data: {
        user: mockUser,
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
      },
    };

    mockedApiService.login.mockResolvedValueOnce(mockAuthResponse);
    mockedAsyncStorage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(mockedApiService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle login failure', async () => {
    const mockError = { message: 'Invalid credentials', status: 401 };
    mockedApiService.login.mockRejectedValueOnce(mockError);
    mockedAsyncStorage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong-password');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should handle successful registration', async () => {
    const mockUser = { id: '1', email: 'new@example.com', first_name: 'New' };
    const mockAuthResponse = {
      success: true,
      data: {
        user: mockUser,
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
      },
    };

    mockedApiService.register.mockResolvedValueOnce(mockAuthResponse);
    mockedAsyncStorage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
      });
    });

    expect(mockedApiService.register).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      first_name: 'New',
      last_name: 'User',
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle logout', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    mockedAsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return Promise.resolve(JSON.stringify(mockUser));
      if (key === 'access_token') return Promise.resolve('mock-token');
      return Promise.resolve(null);
    });

    mockedApiService.logout.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedApiService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should validate token on initialization', async () => {
    mockedAsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'access_token') return Promise.resolve('expired-token');
      return Promise.resolve(null);
    });

    mockedApiService.getProfile.mockRejectedValueOnce({
      message: 'Token expired',
      status: 401,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});