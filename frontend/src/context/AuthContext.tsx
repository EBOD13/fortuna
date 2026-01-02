// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as Keychain from 'react-native-keychain';
import { Session, User } from '@supabase/supabase-js';

type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  state_of_residence: string;
  date_of_birth: string;
  phone_number?: string | null;
  main_occupation: string;
  marital_status: string;
};

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ============ INIT SESSION ============
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load persisted session from Keychain
        const credentials = await Keychain.getGenericPassword({ service: 'SUPABASE_SESSION' });
        if (credentials) {
          const savedSession: Session = JSON.parse(credentials.password);
          setSession(savedSession);
        }

        // Subscribe to auth state changes
        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession ?? null);

          if (newSession) {
            Keychain.setGenericPassword('session', JSON.stringify(newSession), { service: 'SUPABASE_SESSION' });
          } else {
            Keychain.resetGenericPassword({ service: 'SUPABASE_SESSION' });
          }
        });

        return () => listener.subscription.unsubscribe();
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  const isAuthenticated = !!session?.user;

  // ============ REGISTER ============
const register = async (payload: RegisterPayload) => {
  console.log('Starting registration for:', payload.email);
  
  try {
    console.log('Calling supabase.auth.signUp...');
    
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    console.log('SignUp response:', { data, error: signUpError });

    if (signUpError) {
      console.log('SignUp failed:', signUpError.message, signUpError);
      return { success: false, error: signUpError.message };
    }
    
    if (!data.user) {
      console.log('No user returned');
      return { success: false, error: 'User not created' };
    }

    console.log('User created with ID:', data.user.id);
    console.log('Updating profile...');

    const { data: updateData, error: profileError } = await supabase
      .from('users')
      .update({
        first_name: payload.first_name,
        last_name: payload.last_name,
        state_of_residence: payload.state_of_residence,
        date_of_birth: payload.date_of_birth,
        phone_number: payload.phone_number || null,
        main_occupation: payload.main_occupation,
        marital_status: payload.marital_status,
      })
      .eq('id', data.user.id)
      .select();

    console.log('Update response:', { updateData, profileError });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.log('Catch block error:', err);
    return { success: false, error: err.message || 'Registration failed' };
  }
};

  // ============ LOGIN ============
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { success: false, error: error.message };
      if (data.session) {
        setSession(data.session);
        await Keychain.setGenericPassword('session', JSON.stringify(data.session), { service: 'SUPABASE_SESSION' });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // ============ LOGOUT ============
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setSession(null);
      await Keychain.resetGenericPassword({ service: 'SUPABASE_SESSION' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isInitialized,
        isAuthenticated,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
