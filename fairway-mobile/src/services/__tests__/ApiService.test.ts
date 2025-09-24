import ApiService from '../ApiService';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../../config/api';

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('ApiService', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  describe('Authentication', () => {
    it('should login successfully and store tokens', async () => {
      const mockLoginData = {
        user: { id: '1', email: 'test@example.com' },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      };

      const mockResponse = {
        data: { success: true, data: mockLoginData },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await ApiService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        API_CONFIG.ENDPOINTS.LOGIN,
        { email: 'test@example.com', password: 'password123' }
      );

      expect(mockedAsyncStorage.multiSet).toHaveBeenCalledWith([
        ['access_token', 'mock-access-token'],
        ['refresh_token', 'mock-refresh-token'],
        ['user', JSON.stringify(mockLoginData.user)],
      ]);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login failure', async () => {
      const mockError = new Error('Login failed');
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      await expect(
        ApiService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Login failed');
    });

    it('should logout and clear stored data', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce('mock-refresh-token');
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await ApiService.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        API_CONFIG.ENDPOINTS.LOGOUT,
        { refresh_token: 'mock-refresh-token' }
      );

      expect(mockedAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'access_token',
        'refresh_token',
        'user',
      ]);

      expect(result).toEqual({ success: true });
    });
  });

  describe('Course Methods', () => {
    it('should fetch courses successfully', async () => {
      const mockCourses = [
        { id: '1', name: 'Test Course', par: 72 },
        { id: '2', name: 'Another Course', par: 70 },
      ];

      const mockResponse = {
        data: { success: true, data: { courses: mockCourses } },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await ApiService.getCourses();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        API_CONFIG.ENDPOINTS.COURSES
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should search courses with query parameter', async () => {
      const mockCourses = [{ id: '1', name: 'Pine Valley', par: 72 }];
      const mockResponse = {
        data: { success: true, data: { courses: mockCourses } },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await ApiService.searchCourses('Pine Valley');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `${API_CONFIG.ENDPOINTS.COURSES_SEARCH}?q=Pine%20Valley`
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should get nearby courses with location parameters', async () => {
      const mockCourses = [{ id: '1', name: 'Local Course', par: 72 }];
      const mockResponse = {
        data: { success: true, data: { courses: mockCourses } },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await ApiService.getNearbyCourses({
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 10,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `${API_CONFIG.ENDPOINTS.COURSES_NEARBY}?latitude=40.7128&longitude=-74.0060&radius=10`
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Round Methods', () => {
    it('should create a round successfully', async () => {
      const mockRoundData = {
        course_id: '1',
        tee_color: 'white',
        start_latitude: '40.7128',
        start_longitude: '-74.0060',
      };

      const mockResponse = {
        data: { success: true, data: { round: { id: '1', ...mockRoundData } } },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await ApiService.createRound(mockRoundData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        API_CONFIG.ENDPOINTS.ROUNDS,
        { round: mockRoundData }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should update a round successfully', async () => {
      const mockUpdateData = {
        total_strokes: 85,
        completed_at: '2023-10-01T12:00:00Z',
      };

      const mockResponse = {
        data: { success: true, data: { round: { id: '1', ...mockUpdateData } } },
      };

      mockAxiosInstance.patch.mockResolvedValueOnce(mockResponse);

      const result = await ApiService.updateRound('1', mockUpdateData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `${API_CONFIG.ENDPOINTS.ROUNDS}/1`,
        { round: mockUpdateData }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = {
        request: { status: 0 },
        message: 'Network Error',
      };

      mockAxiosInstance.get.mockRejectedValueOnce(networkError);

      await expect(ApiService.getCourses()).rejects.toEqual({
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle server errors with response data', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(serverError);

      await expect(ApiService.getCourses()).rejects.toEqual({
        message: 'Internal server error',
        status: 500,
        code: undefined,
      });
    });
  });
});