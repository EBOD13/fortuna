// src/api/client.ts
/**
 * API Client
 * Axios instance with token management and interceptors
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ CONFIGURATION ============

const API_URLS = {
  development: 'http://localhost:8000/api/v1',
  staging: 'https://staging-api.fortuna.app/api/v1',
  production: 'https://api.fortuna.app/api/v1',
};

const getEnvironment = (): keyof typeof API_URLS => {
  if (__DEV__) {
    return 'development';
  }
  return 'production';
};

export const API_BASE_URL = API_URLS[getEnvironment()];

// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'fortuna_access_token',
  REFRESH_TOKEN: 'fortuna_refresh_token',
  USER_ID: 'fortuna_user_id',
};

// ============ TOKEN MANAGEMENT ============

export const TokenManager = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  },

  async setUserId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error storing user ID:', error);
    }
  },

  async getUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.USER_ID);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        TOKEN_KEYS.ACCESS_TOKEN,
        TOKEN_KEYS.REFRESH_TOKEN,
        TOKEN_KEYS.USER_ID,
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },

  async hasValidToken(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null;
  },
};

// ============ API ERROR TYPES ============

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

export class ApiException extends Error {
  public code: string;
  public status: number;
  public details?: Record<string, any>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}

// ============ CREATE API CLIENT ============

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await TokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (__DEV__) {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors and token refresh
  client.interceptors.response.use(
    (response) => {
      if (__DEV__) {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      }
      return response;
    },
    async (error: AxiosError<{ detail?: string; message?: string }>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (__DEV__) {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        console.error('📦 Error Response:', error.response?.data);
      }

      // Handle 401 - Token expired, attempt refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await TokenManager.getRefreshToken();

          if (refreshToken) {
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;
            await TokenManager.setTokens(access_token, newRefreshToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens
          await TokenManager.clearTokens();
          return Promise.reject(new ApiException({
            message: 'Session expired. Please login again.',
            code: 'SESSION_EXPIRED',
            status: 401,
          }));
        }
      }

      // Build error response
      const apiError: ApiError = {
        message: error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          'An unexpected error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        status: error.response?.status || 500,
        details: error.response?.data,
      };

      return Promise.reject(new ApiException(apiError));
    }
  );

  return client;
};

// ============ EXPORT API CLIENT ============

export const apiClient = createApiClient();

// ============ HELPER METHODS ============

/**
 * GET request
 */
export async function apiGet<T>(url: string, params?: Record<string, any>): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

/**
 * POST request
 */
export async function apiPost<T>(url: string, data?: Record<string, any>): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

/**
 * PUT request
 */
export async function apiPut<T>(url: string, data?: Record<string, any>): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

/**
 * PATCH request
 */
export async function apiPatch<T>(url: string, data?: Record<string, any>): Promise<T> {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
}

/**
 * DELETE request
 */
export async function apiDelete<T = void>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}

export default apiClient;