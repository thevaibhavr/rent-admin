"use client";

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiService } from '@/services/api';
import { Customer } from '@/types';
import Image from 'next/image';
import { MagnifyingGlassIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline';

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCustomers = async (searchTerm = '', pageNum = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getCustomers(pageNum, 20, searchTerm);
      setCustomers(response.data.customers || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotal(response.data.pagination?.total || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers(search, 1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handlePageChange = (newPage: number) => {
    fetchCustomers(search, newPage);
  };

  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getInitials = (name: string) => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
    return initials || '?';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer information and view booking history
          </p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, mobile, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-[#f7ede8] p-4">
            <div className="text-2xl font-bold text-[#633b3b]">{total}</div>
            <div className="text-sm text-[#633b3b]">Total Customers</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="text-2xl font-bold text-emerald-700">
              {customers.filter(c => c.lastBookingDate &&
                new Date(c.lastBookingDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <div className="text-sm text-emerald-700">Active (30 days)</div>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <div className="text-2xl font-bold text-amber-700">
              {customers.reduce((sum, c) => sum + (c.totalBookings || 0), 0)}
            </div>
            <div className="text-sm text-amber-700">Total Bookings</div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
            <UsersIcon className="h-7 w-7" />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-900">No customers found</p>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search to find customers.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Last Booking
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((customer) => (
                  <tr key={customer._id} className="transition-colors hover:bg-[#f7ede8]/40">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {customer.avatar ? (
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={customer.avatar}
                            alt={customer.name}
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7ede8] text-sm font-semibold text-[#633b3b]">
                            {getInitials(customer.name)}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            Size: {customer.measurements?.size || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.mobile}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.totalBookings || 0}</div>
                      {customer.totalSpent && (
                        <div className="text-sm text-gray-500">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {customer.lastBookingDate ? formatDate(customer.lastBookingDate) : 'Never'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => viewCustomerDetails(customer)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && customers.length > 0 && totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-gray-600">
            Showing page <span className="font-medium text-gray-900">{page}</span> of{' '}
            <span className="font-medium text-gray-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-[#b87570] text-white'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {/* Basic Info */}
              <div className="flex items-center space-x-4">
                {selectedCustomer.avatar ? (
                  <Image
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f7ede8] text-2xl font-semibold text-[#633b3b]">
                    {getInitials(selectedCustomer.name)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-gray-600">{selectedCustomer.mobile}</p>
                  {selectedCustomer.email && <p className="text-gray-600">{selectedCustomer.email}</p>}
                </div>
              </div>

              {/* Contact & Location */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Mobile:</span> {selectedCustomer.mobile}</div>
                    {selectedCustomer.email && (
                      <div><span className="text-gray-600">Email:</span> {selectedCustomer.email}</div>
                    )}
                    {selectedCustomer.location && (
                      <div><span className="text-gray-600">Location:</span> {selectedCustomer.location}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Booking Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Total Bookings:</span> {selectedCustomer.totalBookings || 0}</div>
                    {selectedCustomer.totalSpent && (
                      <div><span className="text-gray-600">Total Spent:</span> {formatCurrency(selectedCustomer.totalSpent)}</div>
                    )}
                    {selectedCustomer.lastBookingDate && (
                      <div><span className="text-gray-600">Last Booking:</span> {formatDate(selectedCustomer.lastBookingDate)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Measurements */}
              {selectedCustomer.measurements && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Body Measurements</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 md:grid-cols-6">
                    {selectedCustomer.measurements.bust && (
                      <div className="text-center">
                        <div className="font-medium">{selectedCustomer.measurements.bust}cm</div>
                        <div className="text-gray-600">Bust</div>
                      </div>
                    )}
                    {selectedCustomer.measurements.waist && (
                      <div className="text-center">
                        <div className="font-medium">{selectedCustomer.measurements.waist}cm</div>
                        <div className="text-gray-600">Waist</div>
                      </div>
                    )}
                    {selectedCustomer.measurements.hips && (
                      <div className="text-center">
                        <div className="font-medium">{selectedCustomer.measurements.hips}cm</div>
                        <div className="text-gray-600">Hips</div>
                      </div>
                    )}
                    {selectedCustomer.measurements.shoulder && (
                      <div className="text-center">
                        <div className="font-medium">{selectedCustomer.measurements.shoulder}cm</div>
                        <div className="text-gray-600">Shoulder</div>
                      </div>
                    )}
                    {selectedCustomer.measurements.length && (
                      <div className="text-center">
                        <div className="font-medium">{selectedCustomer.measurements.length}cm</div>
                        <div className="text-gray-600">Length</div>
                      </div>
                    )}
                    {selectedCustomer.measurements.size && (
                      <div className="text-center">
                        <div className="font-medium">{selectedCustomer.measurements.size}</div>
                        <div className="text-gray-600">Size</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {selectedCustomer.emergencyContact && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Emergency Contact</h4>
                  <div className="text-sm">
                    <div><span className="text-gray-600">Name:</span> {selectedCustomer.emergencyContact.name || 'N/A'}</div>
                    <div><span className="text-gray-600">Phone:</span> {selectedCustomer.emergencyContact.phone || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedCustomer.notes && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Notes</h4>
                  <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs text-gray-500">
                  Created: {formatDate(selectedCustomer.createdAt)} |
                  Updated: {formatDate(selectedCustomer.updatedAt)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPageWrapper() {
  return (
    <ProtectedRoute>
      <CustomersPage />
    </ProtectedRoute>
  );
}