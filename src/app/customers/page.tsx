"use client";

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiService } from '@/services/api';
import { Customer } from '@/types';
import Image from 'next/image';

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer information and view booking history
          </p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search customers by name, mobile, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{total}</div>
            <div className="text-sm text-blue-800">Total Customers</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.lastBookingDate &&
                new Date(c.lastBookingDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <div className="text-sm text-green-800">Active (30 days)</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {customers.reduce((sum, c) => sum + (c.totalBookings || 0), 0)}
            </div>
            <div className="text-sm text-purple-800">Total Bookings</div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {customer.avatar ? (
                            <Image
                              className="h-10 w-10 rounded-full object-cover"
                              src={customer.avatar}
                              alt={customer.name}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">
                            Size: {customer.measurements?.size || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.mobile}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.totalBookings || 0}</div>
                      {customer.totalSpent && (
                        <div className="text-sm text-gray-500">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.lastBookingDate ? formatDate(customer.lastBookingDate) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewCustomerDetails(customer)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    ‹
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    ›
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
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
                    <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-2xl font-medium text-gray-700">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-gray-600">{selectedCustomer.mobile}</p>
                    {selectedCustomer.email && <p className="text-gray-600">{selectedCustomer.email}</p>}
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
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
                    <h4 className="font-medium text-gray-900 mb-2">Booking Statistics</h4>
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
                    <h4 className="font-medium text-gray-900 mb-2">Body Measurements</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
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
                    <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                    <div className="text-sm">
                      <div><span className="text-gray-600">Name:</span> {selectedCustomer.emergencyContact.name || 'N/A'}</div>
                      <div><span className="text-gray-600">Phone:</span> {selectedCustomer.emergencyContact.phone || 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedCustomer.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedCustomer.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Created: {formatDate(selectedCustomer.createdAt)} |
                    Updated: {formatDate(selectedCustomer.updatedAt)}
                  </div>
                </div>
              </div>
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