'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Merchant } from '@/types';
import { apiService } from '@/services/api';
import { PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const inputClass = 'mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30';
const labelClass = 'block text-sm font-medium text-gray-700';
const primaryBtn = 'inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn = 'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50';

function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobilenumber: '',
    address: ''
  });

  const fetchMerchants = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (searchTerm) filters.search = searchTerm;

      const response: PaginatedResponse<Merchant> = await apiService.getMerchants(currentPage, 10, filters);
      setMerchants(Array.isArray(response.data.merchants) ? response.data.merchants : []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      toast.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const handleAddMerchant = async () => {
    try {
      const merchantData = {
        ...formData,
        mobilenumber: formData.mobilenumber ? parseInt(formData.mobilenumber) : undefined
      };
      
      await apiService.createMerchant(merchantData);
      toast.success('Merchant created successfully');
      setShowAddModal(false);
      resetForm();
      fetchMerchants();
    } catch (error: unknown) {
      console.error('Error creating merchant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create merchant';
      toast.error(errorMessage);
    }
  };

  const handleEditMerchant = async () => {
    if (!selectedMerchant) return;
    
    try {
      const merchantData = {
        ...formData,
        mobilenumber: formData.mobilenumber ? parseInt(formData.mobilenumber) : undefined
      };
      
      await apiService.updateMerchant(selectedMerchant._id, merchantData);
      toast.success('Merchant updated successfully');
      setShowEditModal(false);
      setSelectedMerchant(null);
      resetForm();
      fetchMerchants();
    } catch (error: unknown) {
      console.error('Error updating merchant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update merchant';
      toast.error(errorMessage);
    }
  };

  const handleDeleteMerchant = async (merchantId: string) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return;

    try {
      await apiService.deleteMerchant(merchantId);
      toast.success('Merchant deleted successfully');
      fetchMerchants();
    } catch (error: unknown) {
      console.error('Error deleting merchant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete merchant';
      toast.error(errorMessage);
    }
  };

  const openEditModal = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setFormData({
      name: merchant.name,
      mobilenumber: merchant.mobilenumber?.toString() || '',
      address: merchant.address || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobilenumber: '',
      address: ''
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        <div className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Merchants</h1>
          <p className="mt-1 text-sm text-gray-500">Manage clothing merchants</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={primaryBtn}
        >
          <PlusIcon className="h-4 w-4" />
          Add Merchant
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
            placeholder="Search by name or address..."
          />
        </div>
      </div>

      {/* Merchants Table */}
      {merchants.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
            <BuildingStorefrontIcon className="h-7 w-7" />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-900">Nothing here yet</p>
          <p className="mt-1 text-sm text-gray-500">Add your first merchant to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mobile Number</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Address</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Created</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {merchants.map((merchant) => (
                  <tr key={merchant._id} className="transition-colors hover:bg-[#f7ede8]/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{merchant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {merchant.mobilenumber ? `+${merchant.mobilenumber}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {merchant.address || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(merchant.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(merchant)}
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-[#f7ede8] hover:text-[#633b3b]"
                          aria-label={`Edit ${merchant.name}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMerchant(merchant._id)}
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${merchant.name}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
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
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Merchant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Merchant</h3>
              <button
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="Merchant name"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobilenumber}
                  onChange={(e) => setFormData({ ...formData, mobilenumber: e.target.value })}
                  className={inputClass}
                  placeholder="Mobile number"
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClass}
                  rows={3}
                  placeholder="Address"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button
                onClick={() => setShowAddModal(false)}
                className={secondaryBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMerchant}
                className={primaryBtn}
              >
                Add Merchant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Merchant Modal */}
      {showEditModal && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Merchant</h3>
              <button
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="Merchant name"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobilenumber}
                  onChange={(e) => setFormData({ ...formData, mobilenumber: e.target.value })}
                  className={inputClass}
                  placeholder="Mobile number"
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClass}
                  rows={3}
                  placeholder="Address"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button
                onClick={() => setShowEditModal(false)}
                className={secondaryBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleEditMerchant}
                className={primaryBtn}
              >
                Update Merchant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MerchantsPageWrapper() {
  return (
    <ProtectedRoute>
      <MerchantsPage />
    </ProtectedRoute>
  );
}
