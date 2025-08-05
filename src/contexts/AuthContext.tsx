import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import type { User, AuthContextType } from '../types';
import { checkSessionStorage } from '../utils/sessionDebug';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      console.log('Initial session check:', session?.user ? 'User found' : 'No user');
      checkSessionStorage();
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user ? 'User present' : 'No user');
        
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true);
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Handle token refresh - verify user profile still exists
          await fetchUserProfile(session.user.id);
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          // Handle initial session restore
          setLoading(true);
          await fetchUserProfile(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If profile doesn't exist, try to create it from auth user data
        if (error.code === 'PGRST116') {
          console.warn('User profile not found, attempting to create from auth data...');
          await createProfileFromAuthUser(userId);
          return;
        }
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone,
          phoneVerified: data.phone_verified || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        console.warn('No user profile data found');
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      // On unexpected errors, sign out to prevent broken state
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const createProfileFromAuthUser = async (userId: string) => {
    try {
      // Get auth user data
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Error getting auth user:', authError);
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      // Extract name from user metadata or email
      const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user profile
      const { data, error: profileError } = await supabase
        .from('users_profile')
        .insert([
          {
            id: authUser.id,
            email: authUser.email || '',
            first_name: firstName,
            last_name: lastName,
            phone_verified: false,
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone,
          phoneVerified: data.phone_verified || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error creating profile from auth user:', error);
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    // Verify session is stored
    if (data.session) {
      console.log('Session created successfully:', data.session.user.email);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users_profile')
        .insert([
          {
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone_verified: false,
          },
        ]);

      if (profileError) throw profileError;
    }
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google auth error:', error);
      throw error;
    }

    console.log('Google auth initiated:', data);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};