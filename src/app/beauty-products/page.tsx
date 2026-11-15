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
import { PlusIcon, XMarkIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { apiService } from '@/services/api';
import { Product, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import MultiImageUpload from '@/components/MultiImageUpload';

interface Category {
  _id: string;
  name: string;
}

interface SupercategoryResponse {
  _id: string;
  name: string;
}

interface BeautyCategoryResponse {
  _id: string;
  name: string;
  supercategory: string | { name: string };
}

interface RoutineCategoryResponse {
  _id: string;
  name: string;
}

interface ProductData {
  name: string;
  description: string;
  mrp?: number;
  originalPrice: number;
  merchantPrice?: number;
  packOf?: number;
  images: string[];
  color: string;
  brand?: string;
  material?: string;
  tags: string[];
  searchKeywords?: string[];
  categories: string[];
  sizes: Array<{ size: string; isAvailable: boolean; quantity: number }>;
  rating?: number;
  ratingUsersNumber?: number;
  stock?: number;
  minDeliveryTime?: string;
}

function BeautyProductsPage() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') || 'add';
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  
  // View products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    mrp: '',
    originalPrice: '',
    merchantPrice: '',
    packOf: '',
    images: [] as string[],
    color: '',
    brand: '',
    material: '',
    tags: '',
    sizes: [{ size: 'Free Size', isAvailable: true, quantity: 1 }] as Array<{ size: string; isAvailable: boolean; quantity: number }>,
    rating: '',
    ratingUsersNumber: '',
    stock: '',
    searchKeywords: '',
    minDeliveryTime: ''
  });

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const filters: Record<string, string> = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterCategory) filters.category = filterCategory;

      const response: PaginatedResponse<Product> = await apiService.getProducts(currentPage, 12, filters);
      setProducts(Array.isArray(response.data.products) ? response.data.products : []);
      setTotalPages(response.data.totalPages || 1);
      setTotalProducts(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }, [currentPage, searchTerm, filterCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (mode === 'view') {
      fetchProducts();
    }
  }, [mode, currentPage, searchTerm, filterCategory, fetchProducts]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const [supercategoriesResponse, beautyCategoriesResponse, routineCategoriesResponse] = await Promise.all([
        apiService.getSupercategories(),
        apiService.getBeautyCategories(),
        apiService.getRoutineCategories()
      ]);

      const allCategories: Category[] = [];
      
      if (supercategoriesResponse && supercategoriesResponse.supercategories) {
        supercategoriesResponse.supercategories.forEach((sc: SupercategoryResponse) => {
          allCategories.push({ _id: sc._id, name: `Supercategory: ${sc.name}` });
        });
      }

      if (beautyCategoriesResponse && beautyCategoriesResponse.categories) {
        beautyCategoriesResponse.categories.forEach((cat: BeautyCategoryResponse) => {
          const supercategoryName = typeof cat.supercategory === 'object'
            ? cat.supercategory.name
            : 'Unknown';
          allCategories.push({ _id: cat._id, name: `Category: ${cat.name} (${supercategoryName})` });
        });
      }

      if (routineCategoriesResponse && routineCategoriesResponse.categories) {
        routineCategoriesResponse.categories.forEach((cat: RoutineCategoryResponse) => {
          allCategories.push({ _id: cat._id, name: `Routine: ${cat.name}` });
        });
      }

      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowProductForm(true);
  };

  const addSizeField = () => {
    setProductForm({
      ...productForm,
      sizes: [...productForm.sizes, { size: 'Free Size', isAvailable: true, quantity: 1 }]
    });
  };

  const removeSizeField = (index: number) => {
    if (productForm.sizes.length > 1) {
      const newSizes = productForm.sizes.filter((_, i) => i !== index);
      setProductForm({ ...productForm, sizes: newSizes });
    }
  };

  const updateSizeField = (index: number, field: 'size' | 'isAvailable' | 'quantity', value: string | number | boolean) => {
    const newSizes = [...productForm.sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setProductForm({ ...productForm, sizes: newSizes });
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      toast.error('Please select a category first');
      return;
    }

    if (productForm.images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    setLoading(true);
    try {
      // Determine category type and prepare product data
      const productData: ProductData = {
        name: productForm.name,
        description: productForm.description,
        mrp: productForm.mrp ? parseFloat(productForm.mrp) : undefined,
        originalPrice: parseFloat(productForm.originalPrice),
        merchantPrice: productForm.merchantPrice ? parseFloat(productForm.merchantPrice) : undefined,
        packOf: productForm.packOf ? parseInt(productForm.packOf) : undefined,
        images: productForm.images,
        color: productForm.color,
        brand: productForm.brand || undefined,
        material: productForm.material || undefined,
        tags: productForm.searchKeywords 
          ? productForm.searchKeywords.split(',').map(t => t.trim()).concat(
              productForm.tags ? productForm.tags.split(',').map(t => t.trim()) : []
            )
          : (productForm.tags ? productForm.tags.split(',').map(t => t.trim()) : []),
        searchKeywords: productForm.searchKeywords ? productForm.searchKeywords.split(',').map(t => t.trim()) : undefined,
        categories: [selectedCategory],
        sizes: productForm.sizes,
        rating: productForm.rating ? parseFloat(productForm.rating) : undefined,
        ratingUsersNumber: productForm.ratingUsersNumber ? parseInt(productForm.ratingUsersNumber) : undefined,
        stock: productForm.stock ? parseInt(productForm.stock) : undefined,
        minDeliveryTime: productForm.minDeliveryTime || undefined
      };

      await apiService.createBeautyProduct(productData);
      
      toast.success('Product created successfully!');
      
      // Reset form
      setProductForm({
        name: '',
        description: '',
        mrp: '',
        originalPrice: '',
        merchantPrice: '',
        packOf: '',
        images: [],
        color: '',
        brand: '',
        material: '',
        tags: '',
        sizes: [{ size: 'Free Size', isAvailable: true, quantity: 1 }],
        rating: '',
        ratingUsersNumber: '',
        stock: '',
        searchKeywords: '',
        minDeliveryTime: ''
      });

    } catch (error: unknown) {
      console.error('Error creating product:', error);
      toast.error(getErrorMessage(error, 'Failed to create product'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await apiService.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      toast.error(getErrorMessage(error, 'Failed to delete product'));
    }
  };

  if (loadingCategories) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        <div className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      </div>
    );
  }

  // View Products Mode
  if (mode === 'view') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">View Beauty Products</h1>
            <p className="mt-1 text-sm text-gray-500">
              Search and filter beauty products
            </p>
          </div>
          <a
            href="/beauty-products?mode=add"
            className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            Add Product
          </a>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Products</h3>
            </div>
            <div className="flex gap-2">
              {(searchTerm || filterCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Show All Products
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Products
              </label>
              <div className="relative mt-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                  placeholder="Search by name..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Filter by Category
              </label>
              <select
                id="category"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full rounded-xl border border-pink-100 bg-pink-50 p-3">
                <p className="text-xs text-pink-700 mb-1">Products Count</p>
                <p className="text-lg font-semibold text-gray-900">
                  {totalProducts > 0 ? (
                    <>
                      {products.length} of {totalProducts} {searchTerm || filterCategory ? 'filtered' : 'total'}
                    </>
                  ) : (
                    '0'
                  )}
                </p>
              </div>
            </div>
          </div>
          {(searchTerm || filterCategory) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Active filters:</span>
                {searchTerm && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700">
                    Search: {searchTerm}
                  </span>
                )}
                {filterCategory && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700">
                    Category: {categories.find(c => c._id === filterCategory)?.name || 'Unknown'}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
              <PlusIcon className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-900">No products found</p>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterCategory 
                ? 'No products found matching your filters.' 
                : 'Create one to get started.'}
            </p>
            {(searchTerm || filterCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setCurrentPage(1);
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Filters and Show All
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div key={product._id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <Image 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      src={product.images[0] || 'https://via.placeholder.com/300x300?text=No+Image'} 
                      alt={product.name}
                      width={300}
                      height={300}
                    />
                    {product.brand && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-pink-600 shadow-sm">
                        {product.brand}
                      </span>
                    )}
                    <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm ${
                      product.isAvailable ? 'bg-emerald-500/95' : 'bg-red-500/95'
                    }`}>
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {product.categories && product.categories.length > 0
                        ? product.categories.map((cat: unknown) => (cat as { name?: string })?.name || String(cat)).join(', ')
                        : product.category?.name || 'No category'
                      }
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">₹{(product.price ?? 0).toLocaleString('en-IN')}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Sizes: {product.sizes.map((s: unknown) => (s as { size?: string })?.size || 'Unknown').join(', ')}
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                      <button 
                        onClick={() => {
                          // Navigate to edit or show edit modal
                          window.location.href = `/beauty-products?mode=add&edit=${product._id}`;
                        }}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600 flex items-center"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product._id)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 flex items-center"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {products.length > 0 && totalPages > 1 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
                <div className="flex items-center gap-3">
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
          </div>
        )}
      </div>
    );
  }

  // Add Product Mode
  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Beauty Products</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add products to beauty categories
            </p>
          </div>
          <a
            href="/beauty-products?mode=view"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View Products
          </a>
        </div>

        {!showProductForm ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Category</h2>
            <p className="text-sm text-gray-600 mb-6">
              Choose a category to add a product to:
            </p>
            
            {categories.length > 0 ? (
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                >
                  <option value="">-- Select a category --</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                  <PlusIcon className="h-7 w-7" />
                </div>
                <p className="mt-4 text-lg font-medium text-gray-900">No categories yet</p>
                <p className="mt-1 text-sm text-gray-500">Please create categories first.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Product</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Category: {categories.find(c => c._id === selectedCategory)?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setSelectedCategory('');
                }}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand *</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="Brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">MRP (Maximum Retail Price) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Original Price *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Merchant Price *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={productForm.merchantPrice}
                    onChange={(e) => setProductForm({ ...productForm, merchantPrice: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="Enter stock quantity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={productForm.rating}
                    onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="0.0 - 5.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating Users Number</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.ratingUsersNumber}
                    onChange={(e) => setProductForm({ ...productForm, ratingUsersNumber: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="Number of users who rated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Delivery Time (Days) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.minDeliveryTime}
                    onChange={(e) => setProductForm({ ...productForm, minDeliveryTime: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="e.g., 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="text"
                    value={productForm.color}
                    onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="e.g., Red, Blue, Natural"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Material</label>
                  <input
                    type="text"
                    value={productForm.material}
                    onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="Material type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Pack Of *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.packOf}
                    onChange={(e) => setProductForm({ ...productForm, packOf: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    placeholder="e.g., 2"
                  />
                </div>

                <div>

                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Available Sizes *</label>
                <div className="mt-1 space-y-3">
                  {productForm.sizes.map((sizeItem, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-100 bg-gray-50/60 rounded-xl">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Size</label>
                        <input
                          type="text"
                          value={sizeItem.size}
                          onChange={(e) => updateSizeField(index, 'size', e.target.value)}
                          className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                          placeholder="e.g., 50ml, 100ml, Free Size"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={sizeItem.quantity}
                          onChange={(e) => updateSizeField(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={sizeItem.isAvailable}
                            onChange={(e) => updateSizeField(index, 'isAvailable', e.target.checked)}
                            className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Available</span>
                        </label>
                      </div>
                      <div className="flex items-end">
                        {productForm.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSizeField(index)}
                            className="rounded-lg p-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSizeField}
                    className="text-sm font-medium text-pink-600 transition-colors hover:text-pink-700"
                  >
                    + Add Another Size
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Search Keywords *</label>
                <input
                  type="text"
                  required
                  value={productForm.searchKeywords}
                  onChange={(e) => setProductForm({ ...productForm, searchKeywords: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                  placeholder="Enter keywords separated by commas (e.g., lipstick, red, matte)"
                />
                <p className="mt-1 text-xs text-gray-500">Keywords help users find this product when searching</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Product Images *</label>
                <div className="mt-1">
                  <MultiImageUpload
                    value={productForm.images}
                    onChange={(images) => setProductForm({ ...productForm, images })}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Upload at least one product image</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setSelectedCategory('');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
  );
}

export default function BeautyProductsPageWrapper() {
  return (
    <ProtectedRoute>
      <BeautyProductsPage />
    </ProtectedRoute>
  );
}

