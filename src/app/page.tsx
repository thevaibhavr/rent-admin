'use client';

import React, { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  UserPlusIcon,
  ArrowPathIcon,
  LockClosedIcon,
  ClockIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiService } from '@/services/api';
import { DashboardStats } from '@/types';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Generate week options for the current year
  const getWeekOptions = () => {
    const weeks = [];
    const currentYear = new Date().getFullYear();
    // Generate 52 weeks for the year
    for (let i = 1; i <= 52; i++) {
      const weekStr = `${currentYear}-${i.toString().padStart(2, '0')}`;
      // Calculate the date range for the week using ISO week calculation
      const [yearNum, weekNum] = weekStr.split('-').map(Number);
      // Jan 4 is always in week 1
      const simple = new Date(yearNum, 0, 4);
      const jan4Day = simple.getDay() || 7; // Convert Sunday (0) to 7
      const weekStart = new Date(simple);
      weekStart.setDate(simple.getDate() - jan4Day + 1 + (weekNum - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Only include weeks that are valid (not extending too far into next year)
      if (weekStart.getFullYear() === yearNum || weekStart.getFullYear() === yearNum - 1) {
        const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        weeks.push({ value: weekStr, label: `Week ${i} (${startStr} - ${endStr})` });
      }
    }
    return weeks;
  };

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (current year and 5 years back)
  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const filters: any = {};
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

        const [bookingStats, userStats] = await Promise.all([
          apiService.getBookingStats(Object.keys(filters).length > 0 ? filters : undefined),
          apiService.getUserStats()
        ]);

        setStats({
          ...bookingStats,
          ...userStats
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [filterType, selectedWeek, selectedMonth, selectedYear]);

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    if (type === 'week') {
      // Set default to current week if not selected
      if (!selectedWeek) {
        const now = new Date();
        const year = now.getFullYear();
        // Calculate current week number
        const start = new Date(year, 0, 1);
        const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
        setSelectedWeek(`${year}-${weekNumber.toString().padStart(2, '0')}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const bookingStatusData = [
    { name: 'Active', value: stats.activeBookings || 0, color: '#3B82F6' },
    { name: 'Completed', value: stats.completedBookings || 0, color: '#10B981' },
    { name: 'Canceled', value: stats.canceledBookings || 0, color: '#DC2626' },
    { name: 'Pending', value: stats.pendingBookings || 0, color: '#F59E0B' },
  ];

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 3000 },
    { month: 'Mar', revenue: 2000 },
    { month: 'Apr', revenue: 2780 },
    { month: 'May', revenue: 1890 },
    { month: 'Jun', revenue: 2390 },
  ];

  const StatCard = ({ title, value, icon: Icon, change, changeType }: {
    title: string;
    value: number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    change?: number;
    changeType?: 'up' | 'down';
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    changeType === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {changeType === 'up' ? (
                      "up"
                      // <TrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      // <TrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                      "down"
                    )}
                    <span className="sr-only">{changeType === 'up' ? 'Increased' : 'Decreased'} by</span>
                    {change}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your booking and customer statistics
          </p>
        </div>
        
        {/* Filter Section */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Filter:</label>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Time</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>

            {filterType === 'week' && (
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {getWeekOptions().map((week) => (
                  <option key={week.value} value={week.value}>
                    {week.label}
                  </option>
                ))}
              </select>
            )}

            {filterType === 'month' && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {getYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </>
            )}

            {filterType === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}

            {filterType && (
              <button
                onClick={() => {
                  setFilterType('');
                  setSelectedWeek('');
                  setSelectedMonth(new Date().getMonth());
                  setSelectedYear(new Date().getFullYear());
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers || 0}
          icon={UsersIcon}
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings || 0}
          icon={CalendarIcon}
        />
        <StatCard
          title="New Customers"
          value={stats.newCustomers || 0}
          icon={UserPlusIcon}
        />
        <StatCard
          title="Repeat Customers"
          value={stats.repeatCustomers || 0}
          icon={ArrowPathIcon}
        />
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue || 0}
          icon={CurrencyDollarIcon}
        />
        <StatCard
          title="Total Advance"
          value={stats.totalAdvance || 0}
          icon={CurrencyDollarIcon}
        />
        <StatCard
          title="Total Pending"
          value={stats.totalPending || 0}
          icon={ClockIcon}
        />
        <StatCard
          title="Security Deposits"
          value={stats.totalSecurity || 0}
          icon={LockClosedIcon}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {bookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Booking Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Active Bookings</span>
              <span className="text-sm font-medium text-blue-600">{stats.activeBookings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Completed Bookings</span>
              <span className="text-sm font-medium text-green-600">{stats.completedBookings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Pending Bookings</span>
              <span className="text-sm font-medium text-yellow-600">{stats.pendingBookings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Canceled Bookings</span>
              <span className="text-sm font-medium text-red-600">{stats.canceledBookings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Bookings</span>
              <span className="text-sm font-medium text-gray-900">{stats.totalBookings || 0}</span>
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Customers</span>
              <span className="text-sm font-medium text-purple-600">{stats.totalCustomers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">New Customers</span>
              <span className="text-sm font-medium text-green-600">{stats.newCustomers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Repeat Customers</span>
              <span className="text-sm font-medium text-blue-600">{stats.repeatCustomers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Repeat Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.totalCustomers ? ((stats.repeatCustomers || 0) / stats.totalCustomers * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Revenue</span>
              <span className="text-sm font-medium text-green-600">${(stats.totalRevenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Advance Collected</span>
              <span className="text-sm font-medium text-blue-600">${(stats.totalAdvance || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Pending Amount</span>
              <span className="text-sm font-medium text-yellow-600">${(stats.totalPending || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Security Deposits</span>
              <span className="text-sm font-medium text-purple-600">${(stats.totalSecurity || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
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
