import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api';
import CacheService from './CacheService';
import {
  ApiResponse,
  ApiError,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Course,
  DetailedCourse,
  NearbyCoursesRequest,
  Round,
  RoundStatistics,
  RecentRound,
  HoleScoreInput,
} from '../types/api';

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear auth and let app handle redirect
            await this.clearStoredAuth();
            console.error('Token refresh failed:', refreshError);
            throw new Error('No refresh token available');
          }
        }
        
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const responseData = error.response.data as any;
      return {
        message: responseData?.error || responseData?.message || 'Server error occurred',
        status: error.response.status,
        code: responseData?.code,
      };
    } else if (error.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR',
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0,
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH}`,
          { refresh_token: refreshToken }
        );

        const { access_token, expires_in } = response.data.data;
        await AsyncStorage.setItem('access_token', access_token);
        
        return access_token;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  private async clearStoredAuth(): Promise<void> {
    await AsyncStorage.multiRemove([
      'access_token',
      'refresh_token', 
      'user',
    ]);
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post(
        API_CONFIG.ENDPOINTS.LOGIN,
        credentials
      );
      
      if (response.data.success && response.data.data) {
        const { user, access_token, refresh_token } = response.data.data;
        
        // Store tokens and user data
        await AsyncStorage.multiSet([
          ['access_token', access_token],
          ['refresh_token', refresh_token],
          ['user', JSON.stringify(user)],
        ]);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post(
        API_CONFIG.ENDPOINTS.REGISTER,
        userData
      );
      
      if (response.data.success && response.data.data) {
        const { user, access_token, refresh_token } = response.data.data;
        
        // Store tokens and user data
        await AsyncStorage.multiSet([
          ['access_token', access_token],
          ['refresh_token', refresh_token],
          ['user', JSON.stringify(user)],
        ]);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      // Call logout endpoint if we have a refresh token
      if (refreshToken) {
        await this.api.post(API_CONFIG.ENDPOINTS.LOGOUT, {
          refresh_token: refreshToken,
        });
      }
      
      // Clear stored auth data
      await this.clearStoredAuth();
      
      return { success: true };
    } catch (error) {
      // Even if logout API call fails, clear local storage
      await this.clearStoredAuth();
      throw error;
    }
  }

  async getProfile(): Promise<ApiResponse<{ user: any }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: any }>> = await this.api.get(
        API_CONFIG.ENDPOINTS.PROFILE
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userData: Partial<any>): Promise<ApiResponse<{ user: any }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: any }>> = await this.api.patch(
        API_CONFIG.ENDPOINTS.PROFILE,
        { user: userData }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Course Methods
  async getCourses(): Promise<ApiResponse<{ courses: Course[] }>> {
    try {
      const cacheKey = 'courses:all';
      
      return await CacheService.getOrSet(
        cacheKey,
        async () => {
          const response: AxiosResponse<ApiResponse<{ courses: Course[] }>> = await this.api.get(
            API_CONFIG.ENDPOINTS.COURSES
          );
          return response.data;
        },
        60 // Cache for 60 minutes
      );
    } catch (error) {
      throw error;
    }
  }

  async getCourse(courseId: string): Promise<ApiResponse<{ course: DetailedCourse }>> {
    try {
      const cacheKey = `course:${courseId}`;
      
      return await CacheService.getOrSet(
        cacheKey,
        async () => {
          const response: AxiosResponse<ApiResponse<{ course: DetailedCourse }>> = await this.api.get(
            `${API_CONFIG.ENDPOINTS.COURSES}/${courseId}`
          );
          return response.data;
        },
        120 // Cache individual courses for 2 hours
      );
    } catch (error) {
      throw error;
    }
  }

  async searchCourses(query: string): Promise<ApiResponse<{ courses: Course[] }>> {
    try {
      const cacheKey = `search:${query.toLowerCase().trim()}`;
      
      return await CacheService.getOrSet(
        cacheKey,
        async () => {
          const response: AxiosResponse<ApiResponse<{ courses: Course[] }>> = await this.api.get(
            `${API_CONFIG.ENDPOINTS.COURSES_SEARCH}?q=${encodeURIComponent(query)}`
          );
          return response.data;
        },
        30 // Cache search results for 30 minutes
      );
    } catch (error) {
      throw error;
    }
  }

  async getNearbyCourses(location: NearbyCoursesRequest): Promise<ApiResponse<{ courses: Course[] }>> {
    try {
      // Create a cache key based on location (rounded to avoid too many cache entries for similar locations)
      const roundedLat = Math.round(location.latitude * 100) / 100;
      const roundedLng = Math.round(location.longitude * 100) / 100;
      const radius = location.radius || 25;
      const cacheKey = `nearby:${roundedLat},${roundedLng}:${radius}`;
      
      return await CacheService.getOrSet(
        cacheKey,
        async () => {
          const params = new URLSearchParams({
            latitude: location.latitude.toString(),
            longitude: location.longitude.toString(),
          });
          
          if (location.radius) {
            params.append('radius', location.radius.toString());
          }
          
          const response: AxiosResponse<ApiResponse<{ courses: Course[] }>> = await this.api.get(
            `${API_CONFIG.ENDPOINTS.COURSES_NEARBY}?${params.toString()}`
          );
          return response.data;
        },
        15 // Cache nearby results for 15 minutes (locations change more frequently)
      );
    } catch (error) {
      throw error;
    }
  }

  // Round Methods
  async getRounds(status?: 'completed' | 'in_progress' | 'verified', limit?: number): Promise<ApiResponse<{ rounds: Round[] }>> {
    try {
      const cacheKey = `rounds:${status || 'all'}:${limit || 'all'}`;
      
      return await CacheService.getOrSet(
        cacheKey,
        async () => {
          const params = new URLSearchParams();
          if (status) params.append('status', status);
          if (limit) params.append('limit', limit.toString());
          
          const url = params.toString() 
            ? `${API_CONFIG.ENDPOINTS.ROUNDS}?${params.toString()}`
            : API_CONFIG.ENDPOINTS.ROUNDS;
            
          const response: AxiosResponse<ApiResponse<{ rounds: Round[] }>> = await this.api.get(url);
          return response.data;
        },
        10 // Cache rounds for 10 minutes
      );
    } catch (error) {
      throw error;
    }
  }

  async getRecentRounds(limit: number = 5): Promise<ApiResponse<{ rounds: Round[] }>> {
    return this.getRounds('completed', limit);
  }

  async getRoundDetails(roundId: string): Promise<ApiResponse<{ round: Round; hole_scores: any[] }>> {
    try {
      const cacheKey = `round_details:${roundId}`;
      
      return await CacheService.getOrSet(
        cacheKey,
        async () => {
          const response: AxiosResponse<ApiResponse<{ round: Round; hole_scores: any[] }>> = await this.api.get(
            `${API_CONFIG.ENDPOINTS.ROUNDS}/${roundId}`
          );
          return response.data;
        },
        30 // Cache round details for 30 minutes
      );
    } catch (error) {
      throw error;
    }
  }

  async createRound(roundData: Partial<Round>): Promise<ApiResponse<{ round: Round }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ round: Round }>> = await this.api.post(
        API_CONFIG.ENDPOINTS.ROUNDS,
        { round: roundData }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateRound(roundId: string, roundData: Partial<Round>): Promise<ApiResponse<{ round: Round }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ round: Round }>> = await this.api.patch(
        `${API_CONFIG.ENDPOINTS.ROUNDS}/${roundId}`,
        { round: roundData }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async addHoleScore(roundId: string, holeScoreData: HoleScoreInput): Promise<ApiResponse<{ hole_score: any }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ hole_score: any }>> = await this.api.post(
        `${API_CONFIG.ENDPOINTS.ROUNDS}/${roundId}/hole_scores`,
        { hole_score: holeScoreData }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getRoundStatistics(): Promise<ApiResponse<{ statistics: RoundStatistics }>> {
    try {
      const cacheKey = 'rounds:statistics';
      
      return await CacheService.getOrSet(
        cacheKey,
        async () => {
          const response: AxiosResponse<ApiResponse<{ statistics: RoundStatistics }>> = await this.api.get(
            API_CONFIG.ENDPOINTS.ROUNDS_STATISTICS
          );
          return response.data;
        },
        5 // Cache statistics for 5 minutes (fresher data needed)
      );
    } catch (error) {
      throw error;
    }
  }

  // Cache Management Methods
  async clearCourseCache(): Promise<void> {
    try {
      const cacheInfo = await CacheService.getCacheInfo();
      const courseCacheKeys = cacheInfo.cacheKeys.filter(key => 
        key.startsWith('courses:') || 
        key.startsWith('course:') || 
        key.startsWith('search:') || 
        key.startsWith('nearby:')
      );

      for (const key of courseCacheKeys) {
        await CacheService.remove(key);
      }
    } catch (error) {
      console.warn('Failed to clear course cache:', error);
    }
  }

  async getCacheInfo() {
    return await CacheService.getCacheInfo();
  }

  async clearAllCache(): Promise<void> {
    await CacheService.clear();
  }
}

// Export singleton instance
export default new ApiService();