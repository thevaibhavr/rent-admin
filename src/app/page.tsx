'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  IndianRupee,
  CalendarCheck,
  Clock,
  Users,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Filter,
  RotateCw,
  Plus,
  Eye,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Hourglass,
  XCircle,
  Banknote,
  Droplets,
  Wrench,
  Truck,
  PiggyBank,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { DashboardStats, Customer } from '@/types';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const inr = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
const num = (value: number) => (value || 0).toLocaleString('en-IN');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_COLORS: Record<string, string> = {
  active: '#b87570',
  completed: '#10b981',
  canceled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  canceled: 'Canceled',
};

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  href: string;
  bar: string;
  chip: string;
  hint?: string;
  hintAccent?: string;
}

function KpiCard({ title, value, icon: Icon, href, bar, chip, hint, hintAccent }: KpiCardProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60"
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold text-gray-900">{value}</p>
          {hint && <p className={`mt-1 text-xs font-medium ${hintAccent ?? 'text-gray-500'}`}>{hint}</p>}
        </div>
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${chip}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-gray-200 transition-colors group-hover:text-[#b87570]" />
    </Link>
  );
}

function Card({ title, subtitle, action, children, className = '' }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const getWeekOptions = () => {
    const weeks = [];
    const currentYear = new Date().getFullYear();
    for (let i = 1; i <= 52; i++) {
      const weekStr = `${currentYear}-${i.toString().padStart(2, '0')}`;
      const [yearNum, weekNum] = weekStr.split('-').map(Number);
      const simple = new Date(yearNum, 0, 4);
      const jan4Day = simple.getDay() || 7;
      const weekStart = new Date(simple);
      weekStart.setDate(simple.getDate() - jan4Day + 1 + (weekNum - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekStart.getFullYear() === yearNum || weekStart.getFullYear() === yearNum - 1) {
        const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        weeks.push({ value: weekStr, label: `Week ${i} (${startStr} - ${endStr})` });
      }
    }
    return weeks;
  };

  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 5; i++) years.push(currentYear - i);
    return years;
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { filter?: string; week?: string; month?: number; year?: number } = {};
      if (filterType) {
        filters.filter = filterType;
        if (filterType === 'week' && selectedWeek) {
          filters.week = selectedWeek;
        } else if (filterType === 'month') {
          filters.month = selectedMonth;
          filters.year = selectedYear;
        } else if (filterType === 'year') {
          filters.year = selectedYear;
        }
      }

      const [bookingStats, userStats, customerStats] = await Promise.all([
        apiService.getBookingStats(Object.keys(filters).length > 0 ? filters : undefined),
        apiService.getUserStats(),
        apiService.getCustomerStats(),
      ]);

      setStats({
        ...bookingStats,
        ...userStats,
        customerTotalCustomers: customerStats.totalCustomers,
        customerActiveCustomers: customerStats.activeCustomers,
        topCustomers: customerStats.topCustomers,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedWeek, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const checkForRefresh = () => {
      const refreshNeeded = localStorage.getItem('dashboardRefreshNeeded');
      if (refreshNeeded) {
        localStorage.removeItem('dashboardRefreshNeeded');
        fetchStats();
      }
    };
    checkForRefresh();
    const interval = setInterval(checkForRefresh, 2000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    if (type === 'week' && !selectedWeek) {
      const now = new Date();
      const year = now.getFullYear();
      const start = new Date(year, 0, 1);
      const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
      setSelectedWeek(`${year}-${weekNumber.toString().padStart(2, '0')}`);
    }
  };

  const clearFilters = () => {
    setFilterType('');
    setSelectedWeek('');
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-gradient-to-br from-[#302628] to-[#211b1d] opacity-90" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-gray-100 bg-white" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl border border-gray-100 bg-white lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
        <p className="text-gray-500">Failed to load dashboard data</p>
        <button
          onClick={fetchStats}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#633b3b] px-4 py-2 text-sm font-medium text-white hover:bg-[#4e2f2f]"
        >
          <RotateCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const bookingStatusData = [
    { name: 'Active', value: stats.activeBookings || 0, color: '#b87570' },
    { name: 'Completed', value: stats.completedBookings || 0, color: '#10b981' },
    { name: 'Pending', value: stats.pendingBookings || 0, color: '#f59e0b' },
    { name: 'Canceled', value: stats.canceledBookings || 0, color: '#ef4444' },
  ];
  const statusTotal = bookingStatusData.reduce((sum, s) => sum + s.value, 0);

  const monthlyTrend = stats.monthlyTrend ?? [];
  const recentBookings = stats.recentBookings ?? [];
  const topCustomers = stats.topCustomers ?? [];

  const totalBookings = stats.totalBookings || 0;
  const totalRevenue = stats.totalRevenue || 0;
  const totalPaid = stats.totalPaid || 0;
  const totalCustomers = stats.customerTotalCustomers || stats.totalCustomers || 0;

  const collectionRate = totalRevenue ? Math.round((totalPaid / totalRevenue) * 100) : 0;
  const completionRate = totalBookings ? Math.round(((stats.completedBookings || 0) / totalBookings) * 100) : 0;
  const avgBookingValue = totalBookings ? totalRevenue / totalBookings : 0;
  const revenuePerCustomer = totalCustomers ? totalRevenue / totalCustomers : 0;
  const repeatRate = totalCustomers ? Math.round(((stats.repeatCustomers || 0) / totalCustomers) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#302628] via-[#3a2d2f] to-[#211b1d] p-6 shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#b87570]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-[#633b3b]/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#e7c9c5]">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.2em]">Clothing rentals overview</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-1 text-sm text-white/60">{today}</p>
            <p className="mt-3 max-w-xl text-sm text-white/70">
              You have <span className="font-semibold text-white">{num(stats.activeBookings || 0)}</span> active bookings and{' '}
              <span className="font-semibold text-white">{inr(stats.totalPending || 0)}</span> in pending payments.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/bookings/view"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
            >
              <Eye className="h-4 w-4" /> View Bookings
            </Link>
            <Link
              href="/bookings/add"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#a5655f]"
            >
              <Plus className="h-4 w-4" /> Create Booking
            </Link>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#b87570]" />
          <span className="text-sm font-medium text-gray-700">Period</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            {[
              { key: '', label: 'All Time' },
              { key: 'week', label: 'Week' },
              { key: 'month', label: 'Month' },
              { key: 'year', label: 'Year' },
            ].map((option) => (
              <button
                key={option.key || 'all'}
                onClick={() => handleFilterChange(option.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterType === option.key
                    ? 'bg-[#633b3b] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {filterType === 'week' && (
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
            >
              {getWeekOptions().map((week) => (
                <option key={week.value} value={week.value}>{week.label}</option>
              ))}
            </select>
          )}

          {filterType === 'month' && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
              >
                {MONTH_NAMES.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
              >
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>
          )}

          {filterType === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
            >
              {getYearOptions().map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}

          {filterType && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#633b3b] transition-colors hover:bg-[#f7ede8]"
            >
              <RotateCw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={inr(totalRevenue)}
          icon={IndianRupee}
          href="/bookings"
          bar="from-[#b87570] to-[#d99f9a]"
          chip="bg-rose-50 text-[#b87570]"
          hint={`${inr(totalPaid)} collected`}
          hintAccent="text-emerald-600"
        />
        <KpiCard
          title="Total Bookings"
          value={num(totalBookings)}
          icon={CalendarCheck}
          href="/bookings/view"
          bar="from-[#633b3b] to-[#9b6261]"
          chip="bg-[#f7ede8] text-[#633b3b]"
          hint={`${num(stats.completedBookings || 0)} completed`}
        />
        <KpiCard
          title="Active Bookings"
          value={num(stats.activeBookings || 0)}
          icon={Clock}
          href="/bookings/view"
          bar="from-indigo-400 to-indigo-200"
          chip="bg-indigo-50 text-indigo-600"
          hint={`${completionRate}% completion rate`}
        />
        <KpiCard
          title="Pending Payments"
          value={inr(stats.totalPending || 0)}
          icon={Wallet}
          href="/bookings"
          bar="from-amber-400 to-amber-200"
          chip="bg-amber-50 text-amber-600"
          hint={`${collectionRate}% collected`}
          hintAccent="text-amber-600"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Customers"
          value={num(totalCustomers)}
          icon={Users}
          href="/customers"
          bar="from-emerald-400 to-emerald-200"
          chip="bg-emerald-50 text-emerald-600"
          hint={`${repeatRate}% repeat rate`}
        />
        <KpiCard
          title="Security Deposits"
          value={inr(stats.totalSecurity || 0)}
          icon={ShieldCheck}
          href="/bookings"
          bar="from-sky-400 to-sky-200"
          chip="bg-sky-50 text-sky-600"
          hint="Held with bookings"
        />
        <KpiCard
          title="New Customers"
          value={num(stats.newCustomers || 0)}
          icon={TrendingUp}
          href="/customers"
          bar="from-violet-400 to-violet-200"
          chip="bg-violet-50 text-violet-600"
          hint="This period"
        />
        <KpiCard
          title={(stats.netProfit || 0) >= 0 ? 'Net Profit' : 'Net Loss'}
          value={inr(Math.abs(stats.netProfit || 0))}
          icon={PiggyBank}
          href="/bookings"
          bar={(stats.netProfit || 0) >= 0 ? 'from-emerald-500 to-teal-300' : 'from-red-500 to-rose-300'}
          chip={(stats.netProfit || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
          hint={`${inr(stats.totalOperationalCost || 0)} operational cost`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Revenue & Profit Trend"
          subtitle="Last 12 months"
          className="lg:col-span-2"
        >
          {monthlyTrend.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b87570" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#b87570" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(value) => `₹${Number(value) >= 1000 ? `${Math.round(Number(value) / 1000)}k` : value}`}
                />
                <Tooltip
                  cursor={{ stroke: '#e2e8f0' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 12 }}
                  formatter={(value, name) => [inr(Number(value)), name]}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#b87570" strokeWidth={2.5} fill="url(#revenueGradient)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} fill="url(#profitGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
              No revenue data available yet
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b87570]" /> Revenue
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Net Profit
            </span>
          </div>
        </Card>

        <Card title="Booking Status" subtitle="Distribution">
          {statusTotal ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 12 }}
                    formatter={(value, name) => [num(Number(value)), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-2">
                {bookingStatusData.map((status) => (
                  <div key={status.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.name}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {num(status.value)}
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {statusTotal ? Math.round((status.value / statusTotal) * 100) : 0}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              No bookings in this period
            </div>
          )}
        </Card>
      </div>

      {/* Recent bookings & top customers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Recent Bookings"
          subtitle="Latest activity"
          className="lg:col-span-2"
          action={
            <Link href="/bookings/view" className="text-sm font-medium text-[#b87570] hover:text-[#633b3b]">
              View all
            </Link>
          }
        >
          {recentBookings.length ? (
            <div className="divide-y divide-gray-50">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: STATUS_COLORS[booking.status] ?? '#64748b' }}
                    >
                      {booking.customerName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{booking.customerName}</p>
                      <p className="truncate text-xs text-gray-500">
                        {booking.customerMobile || '—'} · {booking.itemsCount} item{booking.itemsCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{inr(booking.totalPrice)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span
                      className="hidden rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-block"
                      style={{
                        backgroundColor: `${STATUS_COLORS[booking.status] ?? '#64748b'}1a`,
                        color: STATUS_COLORS[booking.status] ?? '#64748b',
                      }}
                    >
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">No recent bookings</div>
          )}
        </Card>

        <Card title="Top Customers" subtitle="By total spend">
          {topCustomers.length ? (
            <div className="space-y-3">
              {topCustomers.slice(0, 5).map((customer: Customer, index: number) => (
                <div key={customer._id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        index === 0 ? 'bg-amber-100 text-amber-700'
                          : index === 1 ? 'bg-gray-100 text-gray-700'
                          : index === 2 ? 'bg-orange-100 text-orange-700'
                          : 'bg-[#f7ede8] text-[#633b3b]'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="truncate text-xs text-gray-500">{customer.mobile || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{inr(customer.totalSpent || 0)}</p>
                    <p className="text-xs text-gray-400">{num(customer.totalBookings || 0)} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">No customer data</div>
          )}
        </Card>
      </div>

      {/* Financial breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Revenue & Payments">
          <div className="space-y-3">
            {[
              { label: 'Total Revenue', value: totalRevenue, icon: IndianRupee, tone: 'text-emerald-600' },
              { label: 'Amount Collected', value: stats.totalPaid || 0, icon: Banknote, tone: 'text-emerald-600' },
              { label: 'Advance Collected', value: stats.totalAdvance || 0, icon: Wallet, tone: 'text-indigo-600' },
              { label: 'Final Payments', value: stats.totalFinalPayment || 0, icon: CheckCircle2, tone: 'text-violet-600' },
              { label: 'Pending Amount', value: stats.totalPending || 0, icon: Hourglass, tone: 'text-amber-600' },
              { label: 'Security Deposits', value: stats.totalSecurity || 0, icon: ShieldCheck, tone: 'text-sky-600' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <row.icon className={`h-4 w-4 ${row.tone}`} /> {row.label}
                </span>
                <span className={`text-sm font-semibold ${row.tone}`}>{inr(row.value)}</span>
              </div>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                <span>Collection rate</span>
                <span className="font-semibold text-gray-700">{collectionRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#b87570] to-[#d99f9a]" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Costs & Profit">
          <div className="space-y-3">
            {[
              { label: 'Transport Costs', value: stats.totalTransportCost || 0, icon: Truck },
              { label: 'Dry Cleaning', value: stats.totalDryCleaningCost || 0, icon: Droplets },
              { label: 'Repair Costs', value: stats.totalRepairCost || 0, icon: Wrench },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <row.icon className="h-4 w-4 text-red-400" /> {row.label}
                </span>
                <span className="text-sm font-semibold text-red-500">-{inr(row.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm font-medium text-gray-600">Total Operational Cost</span>
              <span className="text-sm font-bold text-red-600">-{inr(stats.totalOperationalCost || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Gross Profit</span>
              <span className={`text-sm font-bold ${(stats.grossProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {inr(stats.grossProfit || 0)}
              </span>
            </div>
          </div>
          <div className={`mt-5 rounded-xl p-4 ${(stats.netProfit || 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${(stats.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {(stats.netProfit || 0) >= 0 ? 'Net Profit' : 'Net Loss'}
                </p>
                <p className={`mt-1 text-2xl font-bold ${(stats.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {inr(Math.abs(stats.netProfit || 0))}
                </p>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${(stats.netProfit || 0) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {(stats.netProfit || 0) >= 0 ? <TrendingUp className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Business Insights" subtitle="Key performance indicators">
          <div className="space-y-3">
            {[
              { label: 'Avg Booking Value', value: inr(avgBookingValue), icon: Activity, tone: 'bg-orange-50 text-orange-600' },
              { label: 'Revenue per Customer', value: inr(revenuePerCustomer), icon: IndianRupee, tone: 'bg-sky-50 text-sky-600' },
              { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
              { label: 'Repeat Rate', value: `${repeatRate}%`, icon: Users, tone: 'bg-violet-50 text-violet-600' },
              { label: 'Collection Rate', value: `${collectionRate}%`, icon: Wallet, tone: 'bg-[#f7ede8] text-[#633b3b]' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
                <span className="flex items-center gap-2.5 text-sm text-gray-600">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${row.tone}`}>
                    <row.icon className="h-4 w-4" />
                  </span>
                  {row.label}
                </span>
                <span className="text-base font-bold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPageWrapper() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
