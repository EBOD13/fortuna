// src/lib/apiClient.ts
import Config from 'react-native-config';
import { supabase } from './supabase'; // or wherever you initialize supabase

const BASE_URL = Config.BASE_URL || 'http://localhost:8000';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('User is not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || 'API request failed');
  }

  return res.json();
}
