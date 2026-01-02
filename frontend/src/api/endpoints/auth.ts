// src/api/endpoints/auth.ts
/**
 * Auth API Endpoints
 * Uses axios directly to avoid circular dependencies with client.ts
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../types';

// ============ CONFIG ============

const BASE_URL = __DEV__
  ? 'http://localhost:8000/api/v1'
  : 'https://api.fortuna.app/api/v1';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'fortuna_access_token',
  REFRESH_TOKEN: 'fortuna_refresh_token',
  USER_ID: 'fortuna_user_id',
};

// ============ TOKEN HELPERS ============

async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  await AsyncStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
}

async function setUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEYS.USER_ID, userId);
}

async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
}

async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    TOKEN_KEYS.ACCESS_TOKEN,
    TOKEN_KEYS.REFRESH_TOKEN,
    TOKEN_KEYS.USER_ID,
  ]);
}

// ============ API FUNCTIONS ============

/**
 * Login with email and password
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(
    `${BASE_URL}/auth/login`,
    credentials,
    { headers: { 'Content-Type': 'application/json' } }
  );

  await setTokens(response.data.access_token, response.data.refresh_token);
  await setUserId(response.data.user.user_id);

  return response.data;
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await axios.post<RegisterResponse>(
    `${BASE_URL}/auth/register`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );

  await setTokens(response.data.access_token, response.data.refresh_token);
  await setUserId(response.data.user.user_id);

  return response.data;
}

/**
 * Logout - clear tokens and notify server
 */
export async function logout(): Promise<void> {
  try {
    const token = await getAccessToken();
    if (token) {
      await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
  } catch (error) {
    console.log('Logout API failed, clearing local tokens');
  } finally {
    await clearTokens();
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const response = await axios.get<User>(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return response.data;
}

/**
 * Check if user has a valid token stored
 */
export async function hasValidToken(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<{ access_token: string; refresh_token: string }> {
  const refreshTokenValue = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  if (!refreshTokenValue) throw new Error('No refresh token');

  const response = await axios.post(`${BASE_URL}/auth/refresh`, {
    refresh_token: refreshTokenValue,
  });

  await setTokens(response.data.access_token, response.data.refresh_token);

  return response.data;
}