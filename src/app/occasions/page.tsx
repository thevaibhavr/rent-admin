'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Occasion } from '@/types';
import { apiService } from '@/services/api';
import { PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import ImageUpload from '@/components/ImageUpload';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PhotoIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const inputClass = 'mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30';
const labelClass = 'block text-sm font-medium text-gray-700';
const primaryBtn = 'inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn = 'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50';

function OccasionsPage() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    status: 'active' as 'active' | 'inactive',
    displayOrder: 0,
  });

  const fetchOccasions = useCallback(async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Occasion> = await apiService.getOccasions(currentPage, 10);
      setOccasions(Array.isArray(response.data.occasions) ? response.data.occasions : []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching occasions:', error);
      toast.error('Failed to load occasions');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchOccasions();
  }, [fetchOccasions]);

  const handleAddOccasion = async () => {
    try {
      await apiService.createOccasion(formData);
      toast.success('Occasion created successfully');
      setShowAddModal(false);
      setFormData({ name: '', description: '', image: '', status: 'active', displayOrder: 0 });
      fetchOccasions();
    } catch (error: unknown) {
      console.error('Error creating occasion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create occasion';
      toast.error(errorMessage);
    }
  };

  const handleEditOccasion = async () => {
    if (!selectedOccasion) return;

    try {
      await apiService.updateOccasion(selectedOccasion._id, formData);
      toast.success('Occasion updated successfully');
      setShowEditModal(false);
      setSelectedOccasion(null);
      setFormData({ name: '', description: '', image: '', status: 'active', displayOrder: 0 });
      fetchOccasions();
    } catch (error: unknown) {
      console.error('Error updating occasion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update occasion';
      toast.error(errorMessage);
    }
  };

  const handleDeleteOccasion = async (occasionId: string) => {
    if (!confirm('Are you sure you want to delete this occasion?')) return;

    try {
      await apiService.deleteOccasion(occasionId);
      toast.success('Occasion deleted successfully');
      fetchOccasions();
    } catch (error: unknown) {
      console.error('Error deleting occasion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete occasion';
      toast.error(errorMessage);
    }
  };

  const openEditModal = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setFormData({
      name: occasion.name,
      description: occasion.description || '',
      image: occasion.image || '',
      status: occasion.status,
      displayOrder: occasion.displayOrder,
    });
    setShowEditModal(true);
  };

  const filteredOccasions = occasions.filter((occasion) =>
    occasion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (occasion.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

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
          <h1 className="text-2xl font-semibold text-gray-900">Occasions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage event and occasion categories for products</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={primaryBtn}
        >
          <PlusIcon className="h-4 w-4" />
          Add Occasion
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
            placeholder="Search by name..."
          />
        </div>
      </div>

      {/* Occasions Table */}
      {filteredOccasions.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
            <CalendarDaysIcon className="h-7 w-7" />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-900">Nothing here yet</p>
          <p className="mt-1 text-sm text-gray-500">Add your first occasion to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Occasion</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Display Order</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Created</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOccasions.map((occasion) => (
                  <tr key={occasion._id} className="transition-colors hover:bg-[#f7ede8]/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            {occasion.image ? (
                              <Image
                                className="h-12 w-12 rounded-lg object-cover"
                                src={occasion.image}
                                alt={occasion.name}
                                width={48}
                                height={48}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center ${occasion.image ? 'hidden' : ''}`}>
                              <PhotoIcon className="w-6 h-6 text-gray-500" />
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{occasion.name}</div>
                          <div className="text-sm text-gray-500">{occasion.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {occasion.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${occasion.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {occasion.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{occasion.displayOrder}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(occasion.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(occasion)}
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-[#f7ede8] hover:text-[#633b3b]"
                          aria-label={`Edit ${occasion.name}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOccasion(occasion._id)}
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${occasion.name}`}
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

      {/* Add Occasion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Occasion</h3>
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
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Wedding" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClass} rows={3} placeholder="Occasion description" />
              </div>
              <div>
                <label className={labelClass}>Image</label>
                <ImageUpload value={formData.image} onChange={(value) => setFormData({ ...formData, image: value })} placeholder="Upload occasion image" />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Display Order</label>
                <input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} className={inputClass} placeholder="0" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button onClick={() => setShowAddModal(false)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleAddOccasion} className={primaryBtn}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Occasion Modal */}
      {showEditModal && selectedOccasion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Occasion</h3>
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
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClass} rows={3} />
              </div>
              <div>
                <label className={labelClass}>Image</label>
                <ImageUpload value={formData.image} onChange={(value) => setFormData({ ...formData, image: value })} placeholder="Upload occasion image" />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Display Order</label>
                <input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button onClick={() => setShowEditModal(false)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleEditOccasion} className={primaryBtn}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OccasionPageWrapper() {
  return (
    <ProtectedRoute>
      <OccasionsPage />
    </ProtectedRoute>
  );
}
