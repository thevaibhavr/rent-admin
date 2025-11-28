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
  SparklesIcon
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="h-8 w-8 text-pink-500" />
              Beauty Section Admin
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage supercategories and categories for the beauty section
            </p>
          </div>
          <button
            onClick={() => router.push('/beauty-products')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('supercategories');
                router.push('/beauty?tab=supercategories');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'supercategories'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Supercategories
            </button>
            <button
              onClick={() => {
                setActiveTab('categories');
                router.push('/beauty?tab=categories');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => {
                setActiveTab('routine-categories');
                router.push('/beauty?tab=routine-categories');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'routine-categories'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Routine Categories
            </button>
          </nav>
        </div>

        {/* Supercategories Tab */}
        {activeTab === 'supercategories' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleCreateSupercategory}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Supercategory
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supercategories.map((supercategory) => (
                <div key={supercategory._id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative h-48">
                    <img
                      src={supercategory.image}
                      alt={supercategory.name}
                      className="w-full h-full object-cover"
                    />
                    {!supercategory.isActive && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                        Inactive
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{supercategory.name}</h3>
                    {supercategory.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{supercategory.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-400">Order: {supercategory.sortOrder}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewSupercategory(supercategory)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditSupercategory(supercategory)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupercategory(supercategory._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {supercategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No supercategories found. Create one to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
              <div className="w-full md:max-w-2xl flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Categories</label>
                  <input
                    type="text"
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    placeholder="Search by name or description"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Supercategory</label>
                  <select
                    value={selectedSupercategoryFilter}
                    onChange={(e) => setSelectedSupercategoryFilter(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
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
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={handleCreateCategory}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Category
                </button>
              </div>
            </div>

            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => {
                  const supercategoryName = typeof category.supercategory === 'object'
                    ? category.supercategory?.name || 'Unknown'
                    : supercategories.find((sc) => sc._id === category.supercategory)?.name || 'Unknown';
                  
                  return (
                    <div key={category._id} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="relative h-48">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                        {!category.isActive && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                            Inactive
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                        <p className="text-xs text-gray-400 mb-2">Supercategory: {supercategoryName}</p>
                        {category.description && (
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{category.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-xs text-gray-400">
                            <div>Order: {category.sortOrder}</div>
                            <div>Products: {category.products}</div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewCategory(category)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {categories.length === 0
                    ? 'No categories found. Create one to get started.'
                    : 'No categories match your current filters.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Routine Categories Tab */}
        {activeTab === 'routine-categories' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleCreateRoutineCategory}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Routine Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routineCategories.map((category) => (
                <div key={category._id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative h-48">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                    {!category.isActive && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                        Inactive
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{category.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-400">Order: {category.sortOrder}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewRoutineCategory(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditRoutineCategory(category)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoutineCategory(category._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {routineCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No routine categories found. Create one to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Supercategory Modal */}
        {showSupercategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingSupercategory ? 'Edit Supercategory' : 'Create Supercategory'}
                </h2>
                <form onSubmit={handleSubmitSupercategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={supercategoryForm.name}
                      onChange={(e) => setSupercategoryForm({ ...supercategoryForm, name: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={supercategoryForm.description}
                      onChange={(e) => setSupercategoryForm({ ...supercategoryForm, description: e.target.value })}
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                    <ImageUpload
                      value={supercategoryForm.image}
                      onChange={(value) => setSupercategoryForm({ ...supercategoryForm, image: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={supercategoryForm.sortOrder}
                        onChange={(e) => setSupercategoryForm({ ...supercategoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={supercategoryForm.isActive}
                          onChange={(e) => setSupercategoryForm({ ...supercategoryForm, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSupercategoryModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {editingSupercategory ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <form onSubmit={handleSubmitCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supercategory *</label>
                    <select
                      required
                      value={categoryForm.supercategory}
                      onChange={(e) => setCategoryForm({ ...categoryForm, supercategory: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a supercategory</option>
                      {supercategories.map((sc) => (
                        <option key={sc._id} value={sc._id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                    <ImageUpload
                      value={categoryForm.image}
                      onChange={(value) => setCategoryForm({ ...categoryForm, image: value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Products</label>
                      <input
                        type="number"
                        value={categoryForm.products}
                        onChange={(e) => setCategoryForm({ ...categoryForm, products: parseInt(e.target.value) || 0 })}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={categoryForm.isActive}
                          onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {editingCategory ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Routine Category Modal */}
        {showRoutineCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingRoutineCategory ? 'Edit Routine Category' : 'Create Routine Category'}
                </h2>
                <form onSubmit={handleSubmitRoutineCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={routineCategoryForm.name}
                      onChange={(e) => setRoutineCategoryForm({ ...routineCategoryForm, name: e.target.value })}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={routineCategoryForm.description}
                      onChange={(e) => setRoutineCategoryForm({ ...routineCategoryForm, description: e.target.value })}
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                    <ImageUpload
                      value={routineCategoryForm.image}
                      onChange={(value) => setRoutineCategoryForm({ ...routineCategoryForm, image: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={routineCategoryForm.sortOrder}
                        onChange={(e) => setRoutineCategoryForm({ ...routineCategoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={routineCategoryForm.isActive}
                          onChange={(e) => setRoutineCategoryForm({ ...routineCategoryForm, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRoutineCategoryModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {editingRoutineCategory ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewingItem && viewMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">View Details</h2>
                  <button
                    onClick={() => {
                      setViewingItem(null);
                      setViewMode(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <img
                      src={viewingItem.image}
                      alt={viewingItem.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{viewingItem.name}</h3>
                    {viewingItem.description && (
                      <p className="text-gray-600 mt-2">{viewingItem.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={viewingItem.isActive ? 'text-green-600' : 'text-red-600'}>
                        {viewingItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Sort Order:</span> {viewingItem.sortOrder}
                    </div>
                    {viewMode === 'category' && 'products' in viewingItem && (
                      <div>
                        <span className="font-medium">Products:</span> {viewingItem.products}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(viewingItem.createdAt).toLocaleDateString()}
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

export default function BeautyPageWrapper() {
  return (
    <ProtectedRoute>
      <BeautyPage />
    </ProtectedRoute>
  );
}

