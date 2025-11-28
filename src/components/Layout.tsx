'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BeautyLayout from './BeautyLayout';
import ClothsLayout from './ClothsLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Don't show layout on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Wait for auth to load
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    router.push('/login');
    return null;
  }

  const isBeautyUser = user.email === 'moment@gmail.com';
  const isClothsUser = !isBeautyUser; // Any user that's not beauty user is cloths user

  // Redirect beauty user away from cloths routes
  useEffect(() => {
    if (isBeautyUser && pathname !== '/login' && !pathname?.startsWith('/beauty')) {
      router.push('/beauty');
    }
  }, [isBeautyUser, pathname, router]);

  // Redirect cloths user away from beauty routes
  useEffect(() => {
    if (isClothsUser && pathname?.startsWith('/beauty')) {
      router.push('/');
    }
  }, [isClothsUser, pathname, router]);

  // Use BeautyLayout for beauty user
  if (isBeautyUser) {
    return <BeautyLayout>{children}</BeautyLayout>;
  }

  // Use ClothsLayout for cloths user
  if (isClothsUser) {
    return <ClothsLayout>{children}</ClothsLayout>;
  }

  // Default fallback
  return <ClothsLayout>{children}</ClothsLayout>;
} 