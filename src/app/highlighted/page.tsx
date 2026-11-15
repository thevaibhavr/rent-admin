'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { apiService } from '@/services/api';
import { Product } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';

const inr = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

function HighlightedProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [highlightedProducts, setHighlightedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchHighlightedProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts(1, 100);
      setProducts(Array.isArray(response.data.products) ? response.data.products : []);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighlightedProducts = async () => {
    try {
      const response = await apiService.getHighlightedProducts();
      setHighlightedProducts(response.products);
    } catch (err) {
      console.error('Error fetching highlighted products:', err);
    }
  };

  const handleHighlightProduct = async (productId: string) => {
    try {
      await apiService.highlightProduct(productId);
      await fetchHighlightedProducts();
      await fetchProducts();
    } catch (err) {
      setError('Failed to highlight product');
      console.error('Error highlighting product:', err);
    }
  };

  const handleUnhighlightProduct = async (productId: string) => {
    try {
      await apiService.unhighlightProduct(productId);
      await fetchHighlightedProducts();
      await fetchProducts();
    } catch (err) {
      setError('Failed to unhighlight product');
      console.error('Error unhighlighting product:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        <div className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Highlighted Products</h1>
          <p className="mt-1 text-sm text-gray-500">Feature products at the top of your storefront</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#f7ede8] px-3 py-1.5 text-sm font-medium text-[#633b3b]">
          <SparklesIcon className="h-4 w-4" />
          {highlightedProducts.length} highlighted
        </span>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Highlighted Products List */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Highlighted Products</h3>
          <p className="mt-0.5 text-sm text-gray-500">Click remove to take a product off the highlighted list</p>
        </div>

        <div className="divide-y divide-gray-50">
          {highlightedProducts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
                <SparklesIcon className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900">Nothing here yet</p>
              <p className="mt-1 text-sm text-gray-500">Add some products below to get started.</p>
            </div>
          ) : (
            highlightedProducts.map((product, index) => (
              <div
                key={product._id}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#f7ede8]/40"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 text-sm font-medium text-gray-400">
                    {index + 1}
                  </div>
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">{inr(product.price || 0)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnhighlightProduct(product._id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Products */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Products</h3>
          <p className="mt-0.5 text-sm text-gray-500">Click a product to add it to the highlighted list</p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
          {products
            .filter(product => !product.isHighlighted)
            .map((product) => (
              <div
                key={product._id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-md"
              >
                <div className="relative h-32 w-full">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                  <p className="mt-0.5 text-sm text-gray-500">{inr(product.price || 0)}</p>
                  <button
                    onClick={() => handleHighlightProduct(product._id)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f]"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    Add to Highlighted
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function HighlightedProductsPageWrapper() {
  return (
    <ProtectedRoute>
      <HighlightedProductsPage />
    </ProtectedRoute>
  );
}
