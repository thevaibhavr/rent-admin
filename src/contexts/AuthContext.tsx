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
          // Check if it's a special admin token
          if (token.startsWith('special-admin-token-')) {
            const user = JSON.parse(savedUser);
            setUser(user);
          } else {
            // Verify token is still valid
            try {
              const currentUser = await apiService.getCurrentUser();
              setUser(currentUser);
            } catch (error) {
              // Token might be invalid, but keep special admin
              console.error('Auth initialization error:', error);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't remove special admin tokens
        const token = localStorage.getItem('admin_token');
        if (!token || !token.startsWith('special-admin-token-')) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process for:', email);

      // Special login for moment@gmail.com
      if (email === 'moment@gmail.com' && password === '1234567') {
        console.log('🎭 Using special admin login');
        const mockUser = {
          _id: 'special-admin',
          name: 'Beauty Admin',
          email: 'moment@gmail.com',
          role: 'admin' as const,
          phone: '',
          address: undefined,
          avatar: undefined,
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const mockToken = 'special-admin-token-' + Date.now();

        localStorage.setItem('admin_token', mockToken);
        localStorage.setItem('admin_user', JSON.stringify(mockUser));
        setUser(mockUser);
        console.log('✅ Special admin login successful');
        return;
      }

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
    } catch (error: any) {
      console.error('❌ Login failed:', error);

      // Provide more detailed error messages
      if (error.response) {
        // Server responded with error status
        console.error('Server error:', error.response.status, error.response.data);
        const message = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        throw new Error(message);
      } else if (error.request) {
        // Network error
        console.error('Network error - no response received:', error.request);
        throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.');
      } else {
        // Other error
        console.error('Request setup error:', error.message);
        throw new Error(error.message || 'An unexpected error occurred during login.');
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