// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AuthState, UserProfile } from '../types';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<{ user: SupabaseUser | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: SupabaseUser | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  getUserProfile: () => Promise<UserProfile | null>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle different auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Trigger theme reset event
    window.dispatchEvent(new CustomEvent('user-logout'));
    
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: error as AuthError };
  }
};

  const getUserProfile = async (): Promise<UserProfile | null> => {
    if (!session?.access_token) return null;

    try {
      const response = await fetch('http://localhost:8000/api/v1/songs/user/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user profile');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getUserProfile,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};