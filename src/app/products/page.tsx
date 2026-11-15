'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Product, Category, ProductSize, Merchant, Occasion, PaginatedResponse } from '@/types';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import MultiImageUpload from '@/components/MultiImageUpload';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon,
  SparklesIcon,
  PhotoIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const inr = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

const getProductErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return error instanceof Error ? error.message : fallback;
};

type ProductFormState = {
  name: string;
  description: string;
  categories: string[];
  occasions: string[];
  Owner: string;
  images: string[];
  price: number;
  originalPrice: number;
  deposit: number;
  sizes: ProductSize[];
  color: string;
  rentalDuration: number;
  condition: NonNullable<Product['condition']>;
  brand: string;
  material: string;
  tags: string[];
  careInstructions: string;
  isFeatured: boolean;
  isAvailable: boolean;
};

const createEmptyForm = (): ProductFormState => ({
  name: '',
  description: '',
  categories: [],
  occasions: [],
  Owner: '',
  images: [''],
  price: 0,
  originalPrice: 0,
  deposit: 0,
  sizes: [{ size: 'M', isAvailable: true, quantity: 1 }],
  color: '',
  rentalDuration: 1,
  condition: 'Good',
  brand: '',
  material: '',
  tags: [''],
  careInstructions: '',
  isFeatured: false,
  isAvailable: true,
});

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30';
const labelClass = 'block text-sm font-medium text-gray-700';
const checkboxClass =
  'rounded border-gray-300 text-[#b87570] shadow-sm focus:border-[#b87570] focus:ring focus:ring-[#b87570]/30';

function ProductForm({
  formData,
  setFormData,
  categories,
  merchants,
  occasions,
}: {
  formData: ProductFormState;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormState>>;
  categories: Category[];
  merchants: Merchant[];
  occasions: Occasion[];
}) {
  const toggleCategory = (id: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      categories: checked ? [...prev.categories, id] : prev.categories.filter((c) => c !== id),
    }));
  };

  const toggleOccasion = (id: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      occasions: checked ? [...prev.occasions, id] : prev.occasions.filter((o) => o !== id),
    }));
  };

  const addSizeField = () =>
    setFormData((prev) => ({ ...prev, sizes: [...prev.sizes, { size: 'M', isAvailable: true, quantity: 1 }] }));
  const removeSizeField = (index: number) =>
    setFormData((prev) => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== index) }));
  const updateSizeField = (index: number, field: keyof ProductSize, value: string | number | boolean) =>
    setFormData((prev) => {
      const sizes = [...prev.sizes];
      sizes[index] = { ...sizes[index], [field]: value };
      return { ...prev, sizes };
    });

  const addTagField = () => setFormData((prev) => ({ ...prev, tags: [...prev.tags, ''] }));
  const removeTagField = (index: number) =>
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  const updateTagField = (index: number, value: string) =>
    setFormData((prev) => {
      const tags = [...prev.tags];
      tags[index] = value;
      return { ...prev, tags };
    });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClass}
            placeholder="Product name"
          />
        </div>
        <div>
          <label className={labelClass}>Merchant</label>
          <select
            value={formData.Owner}
            onChange={(e) => setFormData({ ...formData, Owner: e.target.value })}
            className={inputClass}
          >
            <option value="">Select Merchant (Optional)</option>
            {merchants.map((merchant) => (
              <option key={merchant._id} value={merchant._id}>
                {merchant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Categories</label>
        <div className="mt-1 grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 sm:grid-cols-3">
          {categories.length > 0 ? (
            categories.map((category) => (
              <label key={category._id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.categories.includes(category._id)}
                  onChange={(e) => toggleCategory(category._id, e.target.checked)}
                  className={checkboxClass}
                />
                {category.name}
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500">No categories available.</p>
          )}
        </div>
        {formData.categories.length === 0 && (
          <p className="mt-1 text-sm text-red-600">Please select at least one category</p>
        )}
      </div>

      <fieldset>
        <legend className={labelClass}>Occasions (optional)</legend>
        <div className="mt-1 grid max-h-36 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 sm:grid-cols-2">
          {occasions.length > 0 ? (
            occasions.map((occasion) => (
              <label key={occasion._id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.occasions.includes(occasion._id)}
                  onChange={(e) => toggleOccasion(occasion._id, e.target.checked)}
                  className={checkboxClass}
                />
                {occasion.name}
                {occasion.status === 'inactive' ? ' (Inactive)' : ''}
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500">No occasions available. Add occasions first.</p>
          )}
        </div>
      </fieldset>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={inputClass}
          rows={3}
          placeholder="Product description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <label className={labelClass}>Price (₹)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            className={inputClass}
            placeholder="0"
          />
        </div>
        <div>
          <label className={labelClass}>Original Price (₹)</label>
          <input
            type="number"
            value={formData.originalPrice}
            onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
            className={inputClass}
            placeholder="0"
          />
        </div>
        <div>
          <label className={labelClass}>Deposit (₹)</label>
          <input
            type="number"
            value={formData.deposit}
            onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
            className={inputClass}
            placeholder="0"
          />
        </div>
        <div>
          <label className={labelClass}>Rental Duration (days)</label>
          <input
            type="number"
            value={formData.rentalDuration}
            onChange={(e) => setFormData({ ...formData, rentalDuration: parseInt(e.target.value) || 1 })}
            className={inputClass}
            placeholder="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Color</label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className={inputClass}
            placeholder="Red"
          />
        </div>
        <div>
          <label className={labelClass}>Condition</label>
          <select
            value={formData.condition}
            onChange={(e) =>
              setFormData({ ...formData, condition: e.target.value as NonNullable<Product['condition']> })
            }
            className={inputClass}
          >
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Sizes</label>
        {formData.sizes.map((sizeItem, index) => (
          <div key={index} className="mt-2 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Size</label>
              <select
                value={sizeItem.size}
                onChange={(e) => updateSizeField(index, 'size', e.target.value)}
                className={inputClass}
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="Free Size">Free Size</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                value={sizeItem.quantity}
                onChange={(e) => updateSizeField(index, 'quantity', parseInt(e.target.value) || 1)}
                className={inputClass}
                min="1"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={sizeItem.isAvailable}
                  onChange={(e) => updateSizeField(index, 'isAvailable', e.target.checked)}
                  className={checkboxClass}
                />
                <span className="text-xs text-gray-700">Available</span>
              </label>
            </div>
            {formData.sizes.length > 1 && (
              <div className="flex items-end pb-1">
                <button
                  type="button"
                  onClick={() => removeSizeField(index)}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addSizeField}
          className="mt-2 text-sm font-medium text-[#b87570] hover:text-[#633b3b]"
        >
          + Add Size
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Brand</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className={inputClass}
            placeholder="Brand name"
          />
        </div>
        <div>
          <label className={labelClass}>Material</label>
          <input
            type="text"
            value={formData.material}
            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            className={inputClass}
            placeholder="Cotton, Silk, etc."
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Care Instructions</label>
        <textarea
          value={formData.careInstructions}
          onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
          className={inputClass}
          rows={2}
          placeholder="Care instructions"
        />
      </div>

      <div>
        <label className={labelClass}>Images</label>
        <MultiImageUpload
          value={formData.images}
          onChange={(images) => setFormData({ ...formData, images })}
          maxImages={5}
        />
      </div>

      <div>
        <label className={labelClass}>Tags</label>
        {formData.tags.map((tag, index) => (
          <div key={index} className="mt-1 flex space-x-2">
            <input
              type="text"
              value={tag}
              onChange={(e) => updateTagField(index, e.target.value)}
              className={inputClass}
              placeholder="Tag name"
            />
            {formData.tags.length > 1 && (
              <button
                type="button"
                onClick={() => removeTagField(index)}
                className="rounded-lg px-3 text-red-600 hover:bg-red-50"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addTagField}
          className="mt-2 text-sm font-medium text-[#b87570] hover:text-[#633b3b]"
        >
          + Add Tag
        </button>
      </div>

      <div className="flex items-center gap-6 rounded-lg bg-gray-50 p-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={formData.isFeatured}
            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            className={checkboxClass}
          />
          Featured Product
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            className={checkboxClass}
          />
          Available
        </label>
      </div>
    </div>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormState>(createEmptyForm());

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory) filters.category = selectedCategory;

      const response: PaginatedResponse<Product> = await apiService.getProducts(currentPage, 12, filters);
      setProducts(Array.isArray(response.data.products) ? response.data.products : []);
      setTotalPages(response.data.totalPages || 1);
      setTotalProducts(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const response: PaginatedResponse<Category> = await apiService.getCategories(1, 100);
      setCategories(Array.isArray(response.data.categories) ? response.data.categories : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchMerchants = useCallback(async () => {
    try {
      const response: PaginatedResponse<Merchant> = await apiService.getMerchants(1, 100);
      setMerchants(Array.isArray(response.data.merchants) ? response.data.merchants : []);
    } catch (error) {
      console.error('Error fetching merchants:', error);
    }
  }, []);

  const fetchOccasions = useCallback(async () => {
    try {
      const response: PaginatedResponse<Occasion> = await apiService.getOccasions(1, 100);
      setOccasions(Array.isArray(response.data.occasions) ? response.data.occasions : []);
    } catch (error) {
      console.error('Error fetching occasions:', error);
      toast.error('Failed to load occasions');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchMerchants();
    fetchOccasions();
  }, [fetchProducts, fetchCategories, fetchMerchants, fetchOccasions]);

  const buildPayload = () => ({
    ...formData,
    images: formData.images.filter((img) => img.trim() !== ''),
    tags: formData.tags.filter((tag) => tag.trim() !== ''),
  });

  const handleAddProduct = async () => {
    if (isCreatingProduct) return;
    setIsCreatingProduct(true);
    try {
      await apiService.createProduct(buildPayload());
      toast.success('Product created successfully');
      setShowAddModal(false);
      setFormData(createEmptyForm());
      fetchProducts();
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      toast.error(getProductErrorMessage(error, 'Failed to create product'));
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct || isUpdatingProduct) return;

    setIsUpdatingProduct(true);
    try {
      await apiService.updateProduct(selectedProduct._id, buildPayload());
      toast.success('Product updated successfully');
      setShowEditModal(false);
      setSelectedProduct(null);
      setFormData(createEmptyForm());
      fetchProducts();
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      toast.error(getProductErrorMessage(error, 'Failed to update product'));
    } finally {
      setIsUpdatingProduct(false);
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
      toast.error(getProductErrorMessage(error, 'Failed to delete product'));
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);

    let categoryIds: string[] = [];
    if (product.categories && product.categories.length > 0) {
      categoryIds = product.categories.filter((cat) => cat && cat._id).map((cat) => cat._id);
    }
    if (categoryIds.length === 0 && product.category && product.category._id) {
      categoryIds = [product.category._id];
    }

    setFormData({
      name: product.name,
      description: product.description,
      categories: categoryIds,
      occasions: product.occasions?.map((occasion) => occasion._id) ?? (product.occasion ? [product.occasion._id] : []),
      Owner: product.Owner?._id || '',
      images: product.images.filter((image) => image.trim().length > 0),
      price: product.price || 0,
      originalPrice: product.originalPrice,
      deposit: product.deposit || 0,
      sizes: product.sizes.length > 0 ? product.sizes : [{ size: 'M', isAvailable: true, quantity: 1 }],
      color: product.color || '',
      rentalDuration: product.rentalDuration || 0,
      condition: product.condition ?? 'Good',
      brand: product.brand || '',
      material: product.material || '',
      tags: product.tags.length > 0 ? product.tags : [''],
      careInstructions: product.careInstructions || '',
      isFeatured: product.isFeatured,
      isAvailable: product.isAvailable,
    });
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const hasFilters = Boolean(searchTerm || selectedCategory);
  const categoryLabel = (product: Product) =>
    product.categories && product.categories.length > 0
      ? product.categories.map((cat) => cat.name).join(', ')
      : product.category?.name || 'Uncategorized';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your rental catalog · {totalProducts.toLocaleString('en-IN')} product{totalProducts === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(createEmptyForm());
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f]"
        >
          <PlusIcon className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                placeholder="Search by name..."
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-[#b87570]" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-gray-200 py-2.5 pl-3 pr-8 text-sm text-gray-700 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-[#633b3b] transition-colors hover:bg-[#f7ede8]"
              >
                <XMarkIcon className="h-4 w-4" /> Clear
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{products.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalProducts.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
            <PhotoIcon className="h-7 w-7" />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-900">
            {hasFilters ? 'No products match your filters' : 'No products yet'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {hasFilters ? 'Try adjusting your search or category filter.' : 'Create your first product to get started.'}
          </p>
          {hasFilters ? (
            <button
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#633b3b] px-4 py-2 text-sm font-medium text-white hover:bg-[#4e2f2f]"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a5655f]"
            >
              <PlusIcon className="h-4 w-4" /> Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const sizes = product.sizes?.map((s) => s.size).filter(Boolean) ?? [];
            return (
              <div
                key={product._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#f7ede8] text-[#b87570]">
                      <PhotoIcon className="h-10 w-10" />
                    </div>
                  )}

                  <div className="absolute left-3 top-3 flex gap-2">
                    {product.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-amber-600 shadow-sm">
                        <StarIcon className="h-3.5 w-3.5" /> Featured
                      </span>
                    )}
                    {product.isHighlighted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#b87570] shadow-sm">
                        <SparklesIcon className="h-3.5 w-3.5" /> Highlight
                      </span>
                    )}
                  </div>
                  <span
                    className={`absolute right-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                      product.isAvailable ? 'bg-emerald-500/95 text-white' : 'bg-red-500/95 text-white'
                    }`}
                  >
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="truncate text-sm font-semibold text-gray-900" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-gray-500" title={categoryLabel(product)}>
                    {categoryLabel(product)}
                  </p>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">{inr(product.price || 0)}</span>
                    {product.originalPrice > (product.price || 0) && (
                      <span className="text-sm text-gray-400 line-through">{inr(product.originalPrice)}</span>
                    )}
                  </div>
                  {product.deposit && product.deposit > 0 ? (
                    <p className="mt-0.5 text-xs text-gray-500">+ {inr(product.deposit)} deposit</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {sizes.slice(0, 5).map((size) => (
                      <span
                        key={size}
                        className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                      >
                        {size}
                      </span>
                    ))}
                    {product.color && (
                      <span className="rounded-md bg-[#f7ede8] px-2 py-0.5 text-[11px] font-medium text-[#633b3b]">
                        {product.color}
                      </span>
                    )}
                  </div>

                  {product.Owner?.name && (
                    <p className="mt-2 truncate text-xs text-gray-400">Merchant: {product.Owner.name}</p>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <button
                      onClick={() => openEditModal(product)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#633b3b] transition-colors hover:border-[#b87570] hover:bg-[#f7ede8]"
                    >
                      <PencilSquareIcon className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
                      aria-label={`Delete ${product.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {products.length > 0 && totalPages > 1 && (
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ProductForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                merchants={merchants}
                occasions={occasions}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isCreatingProduct}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={isCreatingProduct}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-[#b87570] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingProduct && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {isCreatingProduct ? 'Creating...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6">
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ProductForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                merchants={merchants}
                occasions={occasions}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdatingProduct}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProduct}
                disabled={isUpdatingProduct}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-[#b87570] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingProduct && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {isUpdatingProduct ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPageWrapper() {
  return (
    <ProtectedRoute>
      <ProductsPage />
    </ProtectedRoute>
  );
}
