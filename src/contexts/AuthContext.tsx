'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { apiService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
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
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const savedUser = localStorage.getItem('admin_user');

        if (token && savedUser) {
          // Verify token is still valid
          try {
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('Auth initialization error:', error);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process for:', email);

      console.log('🌐 Making API call to login endpoint');
      const response = await apiService.login({ email, password });
      console.log('📥 API response received:', response);

      // Check if user is admin
      if (response.user.role !== 'admin') {
        console.error('🚫 User is not admin:', response.user.role);
        throw new Error('Access denied. Admin privileges required.');
      }

      console.log('💾 Storing user data and token');
      localStorage.setItem('admin_token', response.token);
      localStorage.setItem('admin_user', JSON.stringify(response.user));
      setUser(response.user);
      console.log('✅ Login successful');
    } catch (error: unknown) {
      console.error('❌ Login failed:', error);

      // Type guard to check if it's an axios error
      const isAxiosError = (err: unknown): err is { response?: { status: number; data: { message?: string; error?: string } }; request?: unknown; message?: string } => {
        return typeof err === 'object' && err !== null;
      };

      if (isAxiosError(error)) {
        // Provide more detailed error messages for axios errors
        if (error.response) {
          // Server responded with error status
          console.error('Server error:', error.response.status, error.response.data);
          const message = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
          throw new Error(message);
        } else if (error.request) {
          // Network error - no response received
          console.error('Network error - no response received:', error.request);
          throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.');
        } else {
          // Other axios error
          console.error('Request setup error:', error.message);
          throw new Error(error.message || 'An unexpected error occurred during login.');
        }
      } else {
        // Generic error
        const message = error instanceof Error ? error.message : 'An unexpected error occurred during login.';
        console.error('Generic error:', message);
        throw new Error(message);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 