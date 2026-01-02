// src/lib/supabase.ts
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';
import { secureStorage } from './secureStorage';

const SUPABASE_URL = Config.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Config.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase environment variables are missing!');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Disable realtime to avoid the protocol error in React Native
  realtime: {
    params: {
      eventsPerSecond: -1,
    },
  },
  db: {
    schema: 'public',
  },
});

// Prevent realtime from connecting
supabase.realtime.setAuth(null);