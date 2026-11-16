'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
  TagIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  StarIcon,
  SparklesIcon,
  CalendarIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface ClothsLayoutProps {
  children: React.ReactNode;
}

const clothsNavigationGroups = [
  {
    name: 'Overview',
    items: [{ name: 'Dashboard', href: '/', icon: HomeIcon }],
  },
  {
    name: 'Catalog',
    items: [
      { name: 'Products', href: '/products', icon: ShoppingBagIcon },
      { name: 'Categories', href: '/categories', icon: TagIcon },
      { name: 'Occasions', href: '/occasions', icon: SparklesIcon },
      { name: 'Merchants', href: '/merchants', icon: BuildingStorefrontIcon },
      { name: 'Highlighted', href: '/highlighted', icon: StarIcon },
    ],
  },
  {
    name: 'People',
    items: [
      { name: 'Users', href: '/users', icon: UsersIcon },
      { name: 'Customers', href: '/customers', icon: UserCircleIcon },
      { name: 'Visitor Details', href: '/visitor-profiles', icon: UserPlusIcon },
    ],
  },
  {
    name: 'Operations',
    items: [
      { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
      {
        name: 'Bookings',
        href: '/bookings',
        icon: CalendarIcon,
        children: [
          { name: 'View Bookings', href: '/bookings/view' },
          { name: 'Create Booking', href: '/bookings/add' },
        ],
      },
    ],
  },
  {
    name: 'Insights',
    items: [{ name: 'User Analytics', href: '/analytics', icon: ChartBarIcon }],
  },
];

function SidebarNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {clothsNavigationGroups.map((group) => (
        <div key={group.name}>
          <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {group.name}
          </h2>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = pathname === item.href || Boolean(item.children?.some((child) => pathname === child.href));
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onNavigate}
                    className={`group relative flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#f7ede8] text-[#633b3b] shadow-sm'
                        : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#b87570]" />}
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-[#9b6261]' : 'text-white/45 group-hover:text-white/80'
                      }`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#b87570]" />}
                  </Link>
                  {item.children && (
                    <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-4">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            aria-current={isChildActive ? 'page' : undefined}
                            onClick={onNavigate}
                            className={`block rounded-lg px-3 py-2 text-[13px] transition-colors ${
                              isChildActive
                                ? 'bg-white/10 font-medium text-white'
                                : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
                            }`}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function ClothsLayout({ children }: ClothsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    // Redirect if beauty user
    if (!loading && user && user.email === 'moment@gmail.com') {
      router.push('/beauty');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[#b87570]"></div>
      </div>
    );
  }

  if (!user || user.email === 'moment@gmail.com') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-gradient-to-b from-[#302628] to-[#211b1d] shadow-2xl">
          <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b87570] text-white shadow-lg shadow-black/20">
                <SparklesIcon className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-sm font-semibold tracking-wide text-white">RentTheMoment</h1>
                <p className="mt-0.5 text-[11px] text-white/50">Clothing admin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
              className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <SidebarNavigation pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              <div>
                <p className="text-xs font-medium text-white/80">Workspace active</p>
                <p className="mt-0.5 text-[10px] text-white/40">Clothing rentals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-white/10 bg-gradient-to-b from-[#302628] to-[#211b1d]">
          <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b87570] text-white shadow-lg shadow-black/20">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white">RentTheMoment</h1>
              <p className="mt-0.5 text-[11px] text-white/50">Clothing admin</p>
            </div>
          </div>
          <SidebarNavigation pathname={pathname} />
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              <div>
                <p className="text-xs font-medium text-white/80">Workspace active</p>
                <p className="mt-0.5 text-[10px] text-white/40">Clothing rentals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
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

