"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { apiService } from '../services/api';
import { Product } from '../types';

const HighlightedProducts: React.FC = () => {
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Highlighted Products</h2>
        <div className="text-sm text-gray-600">
          {highlightedProducts.length} highlighted products
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Highlighted Products List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Highlighted Products</h3>
          <p className="text-sm text-gray-600">Drag to reorder, click to remove</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {highlightedProducts.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No highlighted products. Add some products below to get started.
            </div>
          ) : (
            highlightedProducts.map((product, index) => (
              <div
                key={product._id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-500 w-8">
                    {index + 1}
                  </div>
                  <div className="relative w-16 h-16">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">₹{product.price}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnhighlightProduct(product._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Products */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Products</h3>
          <p className="text-sm text-gray-600">Click to add to highlighted list</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {products
            .filter(product => !product.isHighlighted)
            .map((product) => (
              <div
                key={product._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="relative w-full h-32 mb-3">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h4>
                <p className="text-sm text-gray-500 mb-2">₹{product.price}</p>
                <button
                  onClick={() => handleHighlightProduct(product._id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Add to Highlighted
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HighlightedProducts;
