'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Helper function to extract error message safely
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return defaultMessage;
};
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import ImageUpload from '@/components/ImageUpload';

interface Supercategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BeautyCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  supercategory: string | Supercategory;
  isActive: boolean;
  sortOrder: number;
  products: number;
  createdAt: string;
  updatedAt: string;
}

interface RoutineCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function BeautyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'supercategories' | 'categories' | 'routine-categories'>('supercategories');
  
  // Handle tab from URL query parameter
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['supercategories', 'categories', 'routine-categories'].includes(tab)) {
      setActiveTab(tab as 'supercategories' | 'categories' | 'routine-categories');
    }
  }, [searchParams]);
  const [supercategories, setSupercategories] = useState<Supercategory[]>([]);
  const [categories, setCategories] = useState<BeautyCategory[]>([]);
  const [routineCategories, setRoutineCategories] = useState<RoutineCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSupercategoryModal, setShowSupercategoryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRoutineCategoryModal, setShowRoutineCategoryModal] = useState(false);
  const [editingSupercategory, setEditingSupercategory] = useState<Supercategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<BeautyCategory | null>(null);
  const [editingRoutineCategory, setEditingRoutineCategory] = useState<RoutineCategory | null>(null);
  const [viewingItem, setViewingItem] = useState<Supercategory | BeautyCategory | RoutineCategory | null>(null);
  const [viewMode, setViewMode] = useState<'supercategory' | 'category' | 'routine-category' | null>(null);
  const [selectedSupercategoryFilter, setSelectedSupercategoryFilter] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Form states
  const [supercategoryForm, setSupercategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    sortOrder: 0,
    isActive: true
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    supercategory: '',
    sortOrder: 0,
    products: 0,
    isActive: true
  });

  const [routineCategoryForm, setRoutineCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    sortOrder: 0,
    isActive: true
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'supercategories') {
        const response = await apiService.getSupercategories();
        setSupercategories(response.supercategories);
      } else if (activeTab === 'categories') {
        const [categoriesResponse, supercategoriesResponse] = await Promise.all([
          apiService.getBeautyCategories(selectedSupercategoryFilter || undefined),
          apiService.getSupercategories()
        ]);
        setCategories(categoriesResponse.categories);
        setSupercategories(supercategoriesResponse.supercategories);
      } else if (activeTab === 'routine-categories') {
        const response = await apiService.getRoutineCategories();
        setRoutineCategories(response.categories);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedSupercategoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSupercategory = () => {
    setEditingSupercategory(null);
    setSupercategoryForm({
      name: '',
      description: '',
      image: '',
      sortOrder: 0,
      isActive: true
    });
    setShowSupercategoryModal(true);
  };

  const handleEditSupercategory = (supercategory: Supercategory) => {
    setEditingSupercategory(supercategory);
    setSupercategoryForm({
      name: supercategory.name,
      description: supercategory.description || '',
      image: supercategory.image,
      sortOrder: supercategory.sortOrder,
      isActive: supercategory.isActive
    });
    setShowSupercategoryModal(true);
  };

  const handleViewSupercategory = (supercategory: Supercategory) => {
    setViewingItem(supercategory);
    setViewMode('supercategory');
  };

  const handleDeleteSupercategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supercategory?')) return;

    try {
      await apiService.deleteSupercategory(id);
      toast.success('Supercategory deleted successfully');
      fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete supercategory'));
    }
  };

  const handleSubmitSupercategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupercategory) {
        await apiService.updateSupercategory(editingSupercategory._id, supercategoryForm);
        toast.success('Supercategory updated successfully');
      } else {
        await apiService.createSupercategory(supercategoryForm);
        toast.success('Supercategory created successfully');
      }
      setShowSupercategoryModal(false);
      fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to save supercategory'));
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      image: '',
      supercategory: selectedSupercategoryFilter || '',
      sortOrder: 0,
      products: 0,
      isActive: true
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: BeautyCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image: category.image,
      supercategory: typeof category.supercategory === 'string' ? category.supercategory : category.supercategory._id,
      sortOrder: category.sortOrder,
      products: category.products,
      isActive: category.isActive
    });
    setShowCategoryModal(true);
  };

  const handleViewCategory = (category: BeautyCategory) => {
    setViewingItem(category);
    setViewMode('category');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await apiService.deleteBeautyCategory(id);
      toast.success('Category deleted successfully');
      fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete category'));
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.supercategory) {
      toast.error('Please select a supercategory');
      return;
    }
    try {
      if (editingCategory) {
        await apiService.updateBeautyCategory(editingCategory._id, categoryForm);
        toast.success('Category updated successfully');
      } else {
        await apiService.createBeautyCategory(categoryForm);
        toast.success('Category created successfully');
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to save category'));
    }
  };

  const handleCreateRoutineCategory = () => {
    setEditingRoutineCategory(null);
    setRoutineCategoryForm({
      name: '',
      description: '',
      image: '',
      sortOrder: 0,
      isActive: true
    });
    setShowRoutineCategoryModal(true);
  };

  const handleEditRoutineCategory = (category: RoutineCategory) => {
    setEditingRoutineCategory(category);
    setRoutineCategoryForm({
      name: category.name,
      description: category.description || '',
      image: category.image,
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
    setShowRoutineCategoryModal(true);
  };

  const handleViewRoutineCategory = (category: RoutineCategory) => {
    setViewingItem(category);
    setViewMode('routine-category');
  };

  const handleDeleteRoutineCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this routine category?')) return;

    try {
      await apiService.deleteRoutineCategory(id);
      toast.success('Routine category deleted successfully');
      fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete routine category'));
    }
  };

  const handleSubmitRoutineCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoutineCategory) {
        await apiService.updateRoutineCategory(editingRoutineCategory._id, routineCategoryForm);
        toast.success('Routine category updated successfully');
      } else {
        await apiService.createRoutineCategory(routineCategoryForm);
        toast.success('Routine category created successfully');
      }
      setShowRoutineCategoryModal(false);
      fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to save routine category'));
    }
  };

  const normalizedCategorySearch = categorySearchTerm.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => {
    const matchesSupercategory = selectedSupercategoryFilter
      ? (typeof category.supercategory === 'string'
          ? category.supercategory === selectedSupercategoryFilter
          : (category.supercategory as Supercategory | undefined)?._id === selectedSupercategoryFilter)
      : true;

    const matchesSearch = normalizedCategorySearch
      ? category.name.toLowerCase().includes(normalizedCategorySearch) ||
        (category.description?.toLowerCase().includes(normalizedCategorySearch) ?? false)
      : true;

    return matchesSupercategory && matchesSearch;
  });

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="h-7 w-7 text-pink-500" />
              Beauty Section Admin
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage supercategories and categories for the beauty section
            </p>
          </div>
          <button
            onClick={() => router.push('/beauty-products')}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-5 w-5" />
            Add Product
          </button>
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
          <button
            onClick={() => {
              setActiveTab('supercategories');
              router.push('/beauty?tab=supercategories');
            }}
            className={`rounded-xl px-4 py-2 text-sm ${
              activeTab === 'supercategories'
                ? 'bg-pink-600 font-semibold text-white shadow-sm'
                : 'font-medium text-gray-600 hover:bg-pink-50'
            }`}
          >
            Supercategories
          </button>
          <button
            onClick={() => {
              setActiveTab('categories');
              router.push('/beauty?tab=categories');
            }}
            className={`rounded-xl px-4 py-2 text-sm ${
              activeTab === 'categories'
                ? 'bg-pink-600 font-semibold text-white shadow-sm'
                : 'font-medium text-gray-600 hover:bg-pink-50'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => {
              setActiveTab('routine-categories');
              router.push('/beauty?tab=routine-categories');
            }}
            className={`rounded-xl px-4 py-2 text-sm ${
              activeTab === 'routine-categories'
                ? 'bg-pink-600 font-semibold text-white shadow-sm'
                : 'font-medium text-gray-600 hover:bg-pink-50'
            }`}
          >
            Routine Categories
          </button>
        </div>

        {/* Supercategories Tab */}
        {activeTab === 'supercategories' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleCreateSupercategory}
                className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-5 w-5" />
                Add Supercategory
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {supercategories.map((supercategory) => (
                <div key={supercategory._id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={supercategory.image}
                      alt={supercategory.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-pink-600 shadow-sm">
                      Order {supercategory.sortOrder}
                    </span>
                    <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm ${
                      supercategory.isActive ? 'bg-emerald-500/95' : 'bg-red-500/95'
                    }`}>
                      {supercategory.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{supercategory.name}</h3>
                    {supercategory.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{supercategory.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => handleViewSupercategory(supercategory)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditSupercategory(supercategory)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupercategory(supercategory._id)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {supercategories.length === 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                  <SparklesIcon className="h-7 w-7" />
                </div>
                <p className="mt-4 text-lg font-medium text-gray-900">Nothing here yet</p>
                <p className="mt-1 text-sm text-gray-500">Create a supercategory to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex w-full flex-col gap-4 sm:flex-row lg:max-w-2xl">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Search Categories</label>
                    <div className="relative mt-1">
                      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        placeholder="Search by name or description"
                        className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Filter by Supercategory</label>
                    <select
                      value={selectedSupercategoryFilter}
                      onChange={(e) => setSelectedSupercategoryFilter(e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    >
                      <option value="">All supercategories</option>
                      {supercategories.map((sc) => (
                        <option key={sc._id} value={sc._id}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(categorySearchTerm || selectedSupercategoryFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCategorySearchTerm('');
                        setSelectedSupercategoryFilter('');
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={handleCreateCategory}
                    className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Category
                  </button>
                </div>
              </div>
            </div>

            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((category) => {
                  const supercategoryName = typeof category.supercategory === 'object'
                    ? category.supercategory?.name || 'Unknown'
                    : supercategories.find((sc) => sc._id === category.supercategory)?.name || 'Unknown';
                  
                  return (
                    <div key={category._id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-pink-600 shadow-sm">
                          {supercategoryName}
                        </span>
                        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm ${
                          category.isActive ? 'bg-emerald-500/95' : 'bg-red-500/95'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{category.description}</p>
                        )}
                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                          <span>Order: {category.sortOrder}</span>
                          <span>Products: {category.products}</span>
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                          <button
                            onClick={() => handleViewCategory(category)}
                            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                  <SparklesIcon className="h-7 w-7" />
                </div>
                <p className="mt-4 text-lg font-medium text-gray-900">Nothing here yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  {categories.length === 0
                    ? 'Create a category to get started.'
                    : 'No categories match your current filters.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Routine Categories Tab */}
        {activeTab === 'routine-categories' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleCreateRoutineCategory}
                className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-5 w-5" />
                Add Routine Category
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {routineCategories.map((category) => (
                <div key={category._id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-pink-600 shadow-sm">
                      Order {category.sortOrder}
                    </span>
                    <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm ${
                      category.isActive ? 'bg-emerald-500/95' : 'bg-red-500/95'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{category.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => handleViewRoutineCategory(category)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditRoutineCategory(category)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoutineCategory(category._id)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {routineCategories.length === 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                  <SparklesIcon className="h-7 w-7" />
                </div>
                <p className="mt-4 text-lg font-medium text-gray-900">Nothing here yet</p>
                <p className="mt-1 text-sm text-gray-500">Create a routine category to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Supercategory Modal */}
        {showSupercategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSupercategory ? 'Edit Supercategory' : 'Create Supercategory'}
                </h3>
                <button
                  onClick={() => setShowSupercategoryModal(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitSupercategory} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={supercategoryForm.name}
                      onChange={(e) => setSupercategoryForm({ ...supercategoryForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={supercategoryForm.description}
                      onChange={(e) => setSupercategoryForm({ ...supercategoryForm, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image *</label>
                    <div className="mt-1">
                      <ImageUpload
                        value={supercategoryForm.image}
                        onChange={(value) => setSupercategoryForm({ ...supercategoryForm, image: value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                      <input
                        type="number"
                        value={supercategoryForm.sortOrder}
                        onChange={(e) => setSupercategoryForm({ ...supercategoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={supercategoryForm.isActive}
                          onChange={(e) => setSupercategoryForm({ ...supercategoryForm, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowSupercategoryModal(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editingSupercategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitCategory} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supercategory *</label>
                    <select
                      required
                      value={categoryForm.supercategory}
                      onChange={(e) => setCategoryForm({ ...categoryForm, supercategory: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    >
                      <option value="">Select a supercategory</option>
                      {supercategories.map((sc) => (
                        <option key={sc._id} value={sc._id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image *</label>
                    <div className="mt-1">
                      <ImageUpload
                        value={categoryForm.image}
                        onChange={(value) => setCategoryForm({ ...categoryForm, image: value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                      <input
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Products</label>
                      <input
                        type="number"
                        value={categoryForm.products}
                        onChange={(e) => setCategoryForm({ ...categoryForm, products: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={categoryForm.isActive}
                          onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Routine Category Modal */}
        {showRoutineCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRoutineCategory ? 'Edit Routine Category' : 'Create Routine Category'}
                </h3>
                <button
                  onClick={() => setShowRoutineCategoryModal(false)}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitRoutineCategory} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={routineCategoryForm.name}
                      onChange={(e) => setRoutineCategoryForm({ ...routineCategoryForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={routineCategoryForm.description}
                      onChange={(e) => setRoutineCategoryForm({ ...routineCategoryForm, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image *</label>
                    <div className="mt-1">
                      <ImageUpload
                        value={routineCategoryForm.image}
                        onChange={(value) => setRoutineCategoryForm({ ...routineCategoryForm, image: value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                      <input
                        type="number"
                        value={routineCategoryForm.sortOrder}
                        onChange={(e) => setRoutineCategoryForm({ ...routineCategoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={routineCategoryForm.isActive}
                          onChange={(e) => setRoutineCategoryForm({ ...routineCategoryForm, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowRoutineCategoryModal(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editingRoutineCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewingItem && viewMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">View Details</h3>
                <button
                  onClick={() => {
                    setViewingItem(null);
                    setViewMode(null);
                  }}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={viewingItem.image}
                    alt={viewingItem.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{viewingItem.name}</h3>
                  {viewingItem.description && (
                    <p className="mt-2 text-sm text-gray-600">{viewingItem.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>{' '}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      viewingItem.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {viewingItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sort Order:</span> {viewingItem.sortOrder}
                  </div>
                  {viewMode === 'category' && 'products' in viewingItem && (
                    <div>
                      <span className="font-medium text-gray-700">Products:</span> {viewingItem.products}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>{' '}
                    {new Date(viewingItem.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default function BeautyPageWrapper() {
  return (
    <ProtectedRoute>
      <BeautyPage />
    </ProtectedRoute>
  );
}

