'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Category } from '@/types';
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
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const inputClass = 'mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30';
const labelClass = 'block text-sm font-medium text-gray-700';
const primaryBtn = 'inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn = 'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50';

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    sortOrder: 0
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Category> = await apiService.getCategories(currentPage, 10);
      setCategories(Array.isArray(response.data.categories) ? response.data.categories : []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    try {
      await apiService.createCategory(formData);
      toast.success('Category created successfully');
      setShowAddModal(false);
      setFormData({ name: '', description: '', image: '', sortOrder: 0 });
      fetchCategories();
    } catch (error: unknown) {
      console.error('Error creating category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      toast.error(errorMessage);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      await apiService.updateCategory(selectedCategory._id, formData);
      toast.success('Category updated successfully');
      setShowEditModal(false);
      setSelectedCategory(null);
      setFormData({ name: '', description: '', image: '', sortOrder: 0 });
      fetchCategories();
    } catch (error: unknown) {
      console.error('Error updating category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      toast.error(errorMessage);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await apiService.deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: unknown) {
      console.error('Error deleting category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(errorMessage);
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image,
      sortOrder: category.sortOrder
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Manage product categories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={primaryBtn}
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
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

      {/* Categories Table */}
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
            <Squares2X2Icon className="h-7 w-7" />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-900">Nothing here yet</p>
          <p className="mt-1 text-sm text-gray-500">Add your first category to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Sort Order</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Created</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((category) => (
                  <tr key={category._id} className="transition-colors hover:bg-[#f7ede8]/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            {category.image ? (
                              <Image
                                className="h-12 w-12 rounded-lg object-cover"
                                src={category.image}
                                alt={category.name}
                                width={48}
                                height={48}
                                onError={(e) => {
                                  // Hide the image and show fallback
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center ${category.image ? 'hidden' : ''}`}>
                              <PhotoIcon className="w-6 h-6 text-gray-500" />
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">{category.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {category.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        category.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(category.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(category)}
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-[#f7ede8] hover:text-[#633b3b]"
                          aria-label={`Edit ${category.name}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${category.name}`}
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

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
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
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputClass}
                  rows={3}
                  placeholder="Category description"
                />
              </div>
              <div>
                <label className={labelClass}>Category Image</label>
                <ImageUpload
                  value={formData.image}
                  onChange={(value) => setFormData({ ...formData, image: value })}
                  placeholder="Upload category image"
                />
              </div>
              <div>
                <label className={labelClass}>Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  placeholder="0"
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
                onClick={handleAddCategory}
                className={primaryBtn}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Category</h3>
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
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputClass}
                  rows={3}
                  placeholder="Category description"
                />
              </div>
              <div>
                <label className={labelClass}>Category Image</label>
                <ImageUpload
                  value={formData.image}
                  onChange={(value) => setFormData({ ...formData, image: value })}
                  placeholder="Upload category image"
                />
              </div>
              <div>
                <label className={labelClass}>Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  placeholder="0"
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
                onClick={handleEditCategory}
                className={primaryBtn}
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPageWrapper() {
  return (
    <ProtectedRoute>
      <CategoriesPage />
    </ProtectedRoute>
  );
}
