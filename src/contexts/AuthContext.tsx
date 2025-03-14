import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthState, User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        handleSessionChange(session);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSessionChange = async (session: Session | null) => {
    if (session && session.user) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        const user: User = {
          id: session.user.id,
          name: profile.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatarUrl: profile.avatar_url,
        };

        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setAuthState({
          isAuthenticated: true,
          user: {
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
          },
          isLoading: false,
        });
      }
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Logged in successfully',
        duration: 3000,
      });
      
      // Redirect to projects page instead of dashboard
      navigate('/projects');
    } catch (error) {
      console.error('Login failed', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Login failed. Please check your credentials.',
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name,
          }
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Your account has been created successfully',
        duration: 3000,
      });
      
      // If user is successfully created (and email confirmation is not required)
      if (data.user) {
        // Go directly to projects page - no need to check for table existence
        navigate('/projects');
      } else {
        toast({
          title: 'Verification required',
          description: 'Please check your email to verify your account before logging in',
          duration: 5000,
        });
        navigate('/login');
      }
    } catch (error) {
      console.error('Signup failed', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Signup failed. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'You have been logged out successfully',
        duration: 3000,
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Logout failed',
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
