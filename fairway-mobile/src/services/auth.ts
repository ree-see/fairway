import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { User, LoginResponse, ApiResponse } from '../types';

export class AuthService {
  private baseURL = 'http://localhost:3000/api/v1'; // Rails API endpoint

  constructor() {
    // Set default axios configuration
    axios.defaults.baseURL = this.baseURL;
    this.setupInterceptors();
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        password
      });

      const { user, token } = response.data.data;

      // Store authentication data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      return { user, token };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid credentials');
      }
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<LoginResponse> {
    try {
      const response = await axios.post<ApiResponse<LoginResponse>>('/auth/register', userData);
      
      const { user, token } = response.data.data;

      // Store authentication data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      return { user, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  /**
   * Logout user and clear stored data
   */
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('currentUser');
  }

  /**
   * Get current authenticated user from storage
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }

  /**
   * Get stored authentication token
   */
  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  /**
   * Setup axios interceptors for authentication
   */
  private setupInterceptors(): void {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, logout user
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }
}