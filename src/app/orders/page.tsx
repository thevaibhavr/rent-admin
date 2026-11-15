'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Order } from '@/types';
import { apiService } from '@/services/api';
import { PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  MagnifyingGlassIcon,
  PencilIcon,
  XMarkIcon,
  FunnelIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

function OrdersPage() {
  // Use null for initial state to indicate not-yet-loaded
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusForm, setStatusForm] = useState<{
    orderStatus: Order['orderStatus'];
    paymentStatus: Order['paymentStatus'];
    adminNotes: string;
  }>({
    orderStatus: 'Pending',
    paymentStatus: 'Pending',
    adminNotes: ''
  });

  const [, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;

      const response: PaginatedResponse<Order> = await apiService.getOrders(currentPage, 10, filters);
      
      // Handle server-side data safely
      let ordersData: Order[] = [];
      if (response.data && 'orders' in response.data) {
        ordersData = Array.isArray(response.data.orders) ? response.data.orders : [];
      }
      
      setOrders(ordersData);
      setTotalPages(response.data.totalPages || 1);
    } catch {
      console.error('Error fetching orders');
      toast.error('Failed to load orders');
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      await apiService.updateOrderStatus(selectedOrder._id, statusForm);
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      setSelectedOrder(null);
      setStatusForm({ orderStatus: 'Pending', paymentStatus: 'Pending', adminNotes: '' });
      fetchOrders();
    } catch (err: unknown) {
      console.error('Error updating order status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      toast.error(errorMessage);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await apiService.cancelOrder(orderId, 'Order cancelled by admin');
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (err: unknown) {
      console.error('Error cancelling order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
      toast.error(errorMessage);
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusForm({
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      adminNotes: order.adminNotes || ''
    });
    setShowStatusModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700';
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-700';
      case 'Processing':
        return 'bg-amber-50 text-amber-700';
      case 'Shipped':
        return 'bg-emerald-50 text-emerald-700';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700';
      case 'Returned':
        return 'bg-amber-50 text-amber-700';
      case 'Cancelled':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700';
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700';
      case 'Failed':
        return 'bg-red-50 text-red-700';
      case 'Refunded':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Use ISO format for consistent server/client rendering
      return date.toISOString().split('T')[0];
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      // Use fixed format instead of Intl for consistent server/client rendering
      return `₹${amount.toFixed(2)}`;
    } catch {
      return '₹0.00';
    }
  };

  // Remove the early loading return to prevent hydration mismatch
  // Loading state is now handled in the table body

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                placeholder="Search by order number..."
                aria-label="Search orders"
              />
            </div>

            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-[#b87570]" />
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 py-2.5 pl-3 pr-8 text-sm text-gray-700 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                aria-label="Filter by order status"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Returned">Returned</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {orders !== null && orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
            <ShoppingBagIcon className="h-7 w-7" />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-900">No orders found</p>
          <p className="mt-1 text-sm text-gray-500">Orders placed by customers will appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Order</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Items</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Total</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Payment</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!orders ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#b87570]/30 border-t-[#b87570]" />
                        Loading orders...
                      </div>
                    </td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order._id} className="transition-colors hover:bg-[#f7ede8]/40">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">#{order._id.slice(-8)}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order?.user?.name}</div>
                      <div className="text-sm text-gray-500">{order?.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.slice(0, 2).map(item => item.product?.name || 'Product unavailable').join(', ')}
                        {order.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openStatusModal(order)}
                          className="rounded-lg p-1.5 text-[#633b3b] transition-colors hover:bg-[#f7ede8]"
                          title="Update Status"
                          aria-label="Update status"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered' && (
                          <button 
                            onClick={() => handleCancelOrder(order._id)}
                            className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                            title="Cancel Order"
                            aria-label="Cancel order"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-6">
          <p className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Status</label>
                <select
                  value={statusForm.orderStatus}
                  onChange={(e) => setStatusForm({ ...statusForm, orderStatus: e.target.value as Order["orderStatus"] })}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Returned">Returned</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                <select
                  value={statusForm.paymentStatus}
                  onChange={(e) => setStatusForm({ ...statusForm, paymentStatus: e.target.value as Order["paymentStatus"] })}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                <textarea
                  value={statusForm.adminNotes}
                  onChange={(e) => setStatusForm({ ...statusForm, adminNotes: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  rows={3}
                  placeholder="Add notes about this order..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button
                onClick={() => setShowStatusModal(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPageWrapper() {
  return (
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  );
} 
