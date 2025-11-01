'use client';

import React, { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  ShoppingCartIcon, 
  CurrencyDollarIcon,
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

// COLORS array removed as it's not being used

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orderStats, userStats] = await Promise.all([
          apiService.getOrderStats(),
          apiService.getUserStats()
        ]);

        setStats({
          ...orderStats,
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
  }, []);

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

  const orderStatusData = [
    { name: 'Pending', value: stats.pendingOrders, color: '#F59E0B' },
    { name: 'Completed', value: stats.completedOrders, color: '#10B981' },
    { name: 'Cancelled', value: stats.cancelledOrders, color: '#EF4444' },
  ];

  // userData removed as it's not being used

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your clothing rental business
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={UsersIcon}
          change={12}
          changeType="up"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCartIcon}
          change={8}
          changeType="up"
        />
        <StatCard
          title="Total Products"
          value={stats.totalUsers} // This would need to be added to the API
          icon={ShoppingBagIcon}
          change={-3}
          changeType="down"
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={CurrencyDollarIcon}
          change={15}
          changeType="up"
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

        {/* Order Status Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // label={({ name, percent }) => `${namce} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
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
        {/* User Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Active Users</span>
              <span className="text-sm font-medium text-green-600">{stats.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Inactive Users</span>
              <span className="text-sm font-medium text-gray-600">{stats.inactiveUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Admin Users</span>
              <span className="text-sm font-medium text-blue-600">{stats.adminUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Regular Users</span>
              <span className="text-sm font-medium text-purple-600">{stats.regularUsers}</span>
            </div>
          </div>
        </div>

        {/* Order Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Pending Orders</span>
              <span className="text-sm font-medium text-yellow-600">{stats.pendingOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Completed Orders</span>
              <span className="text-sm font-medium text-green-600">{stats.completedOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Cancelled Orders</span>
              <span className="text-sm font-medium text-red-600">{stats.cancelledOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Revenue</span>
              <span className="text-sm font-medium text-green-600">${stats.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              View Recent Orders
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              Add New Product
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              Manage Categories
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              User Management
            </button>
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
