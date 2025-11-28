'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  SparklesIcon,
  TagIcon,
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface BeautyLayoutProps {
  children: React.ReactNode;
}

const beautyNavigation = [
  { name: 'Beauty Dashboard', href: '/beauty', icon: HomeIcon },
  { name: 'Supercategories', href: '/beauty?tab=supercategories', icon: TagIcon, tab: 'supercategories' },
  { name: 'Categories', href: '/beauty?tab=categories', icon: TagIcon, tab: 'categories' },
  { name: 'Routine Categories', href: '/beauty?tab=routine-categories', icon: TagIcon, tab: 'routine-categories' },
  { name: 'Section Categories', href: '/beauty-categories', icon: TagIcon },
  { name: 'Add Product', href: '/beauty-products?mode=add', icon: ShoppingBagIcon },
  { name: 'View Products', href: '/beauty-products?mode=view', icon: ShoppingBagIcon },
];

export default function BeautyLayout({ children }: BeautyLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    // Redirect if not beauty user
    if (!loading && user && user.email !== 'moment@gmail.com') {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!user || user.email !== 'moment@gmail.com') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-pink-50">
          <div className="flex h-16 items-center justify-between px-4 bg-pink-600">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-white" />
              <h1 className="text-xl font-bold text-white">Beauty Admin</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {beautyNavigation.map((item) => {
              let isActive = false;
              if (item.href.includes('?tab=') && item.tab) {
                const currentTab = searchParams?.get('tab');
                isActive = pathname === '/beauty' && currentTab === item.tab;
              } else if (item.href.includes('?mode=')) {
                const currentMode = searchParams?.get('mode');
                const itemMode = item.href.split('mode=')[1]?.split('&')[0];
                isActive = pathname === '/beauty-products' && currentMode === itemMode;
              } else {
                isActive = pathname === item.href;
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-700 hover:bg-pink-50 hover:text-pink-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon && (
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-pink-500' : 'text-gray-400 group-hover:text-pink-500'
                      }`}
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-pink-50 border-r border-pink-200">
          <div className="flex h-16 items-center px-4 bg-pink-600">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-white" />
              <h1 className="text-xl font-bold text-white">Beauty Admin</h1>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {beautyNavigation.map((item) => {
              let isActive = false;
              if (item.href.includes('?tab=') && item.tab) {
                const currentTab = searchParams?.get('tab');
                isActive = pathname === '/beauty' && currentTab === item.tab;
              } else if (item.href.includes('?mode=')) {
                const currentMode = searchParams?.get('mode');
                const itemMode = item.href.split('mode=')[1]?.split('&')[0];
                isActive = pathname === '/beauty-products' && currentMode === itemMode;
              } else {
                isActive = pathname === item.href;
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-700 hover:bg-pink-50 hover:text-pink-900'
                  }`}
                >
                  {item.icon && (
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-pink-500' : 'text-gray-400 group-hover:text-pink-500'
                      }`}
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-pink-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Profile dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    <div className="hidden md:block">
                      <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span className="hidden md:block">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

