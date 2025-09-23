import { AuthService } from '../../src/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock axios
jest.mock('axios');

describe('AuthService', () => {
  let authService: AuthService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully log in a user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const expectedResponse = {
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        },
        token: 'jwt-token-here'
      };

      // Mock successful API response
      const mockAxios = require('axios');
      mockAxios.post.mockResolvedValueOnce({
        data: expectedResponse
      });

      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const result = await authService.login(loginData.email, loginData.password);

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('authToken', expectedResponse.token);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw error for invalid credentials', async () => {
      const mockAxios = require('axios');
      mockAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: { error: 'Invalid credentials' } }
      });

      await expect(
        authService.login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear stored authentication data', async () => {
      mockAsyncStorage.removeItem.mockResolvedValueOnce(undefined);

      await authService.logout();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('getCurrentUser', () => {
    it('should return cached user data', async () => {
      const userData = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(userData));

      const result = await authService.getCurrentUser();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('currentUser');
      expect(result).toEqual(userData);
    });

    it('should return null when no user is cached', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('valid-token');

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});