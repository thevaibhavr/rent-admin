"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import ImageUpload from './ImageUpload';
import { apiService } from '@/services/api';
import { Product, Booking } from '@/types';

interface BookingFormData {
  dressId: string;
  priceAfterBargain: number;
  advance: number;
  pending: number;
  securityAmount: number;
  sendDate: string;
  receiveDate: string;
  customer: {
    name: string;
    image?: string;
    location?: string;
    mobile?: string;
  };
  referenceCustomer?: string;
  dressImage?: string;
}

interface Props {
  onSaved?: (booking: Booking) => void;
  initial?: Partial<Booking>;
}

const BookingForm: React.FC<Props> = ({ onSaved, initial = {} as Partial<Booking> }) => {
  const [dresses, setDresses] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<BookingFormData>({
    dressId: initial.dressId ?? '',
    priceAfterBargain: initial.priceAfterBargain ?? 0,
    advance: initial.advance ?? 0,
    pending: initial.pending ?? 0,
    securityAmount: initial.securityAmount ?? 0,
    sendDate: initial.sendDate ?? '',
    receiveDate: initial.receiveDate ?? '',
    customer: {
      name: initial.customer?.name ?? '',
      image: initial.customer?.image ?? '',
      location: initial.customer?.location ?? '',
      mobile: initial.customer?.mobile ?? ''
    },
    referenceCustomer: initial.referenceCustomer ?? '',
    dressImage: initial.dressImage ?? ''
  });

  const fetchProducts = useCallback(async (searchTerm: string = '') => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      const response = await apiService.getProducts(1, 100, filters);
      
      // Handle PaginatedResponse structure
      let items: Product[] = [];
      if (response && response.data) {
        if (Array.isArray(response.data.products)) {
          items = response.data.products;
        } else if (Array.isArray(response.data)) {
          items = response.data;
        }
      } else if (Array.isArray(response)) {
        items = response;
      }
      
      setDresses(items);
    } catch {
      console.error('Error fetching products');
      setDresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load - fetch all products
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchProducts(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, fetchProducts]);

  const filtered = dresses.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase()) ||
    d.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = dresses.find(p => p._id === form.dressId);

  const handleChange = (path: keyof BookingFormData, value: string | number) => {
    setForm((f: BookingFormData) => ({ ...f, [path]: value as never }));
  };

  const handleCustomerChange = (key: keyof BookingFormData['customer'], value: string) => {
    setForm((f: BookingFormData) => ({ 
      ...f, 
      customer: { ...f.customer, [key]: value } 
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...form };
      const booking = await apiService.createBooking(payload);
      if (onSaved) onSaved(booking);
      alert('Booking saved');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save booking');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for products (e.g., dress, gown, saree)..."
          className="mt-1 block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
        />
        {loading && (
          <div className="mt-2 text-sm text-gray-500">Searching products...</div>
        )}
        <select
          value={form.dressId}
          onChange={(e) => {
            const id = e.target.value;
            handleChange('dressId', id);
            const p = dresses.find(x => x._id === id);
            if (p && p.images && p.images.length > 0) {
              handleChange('dressImage', p.images[0]);
            }
          }}
          className="mt-2 block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
          disabled={loading}
        >
          <option value="">-- Select Product --</option>
          {filtered.length === 0 && !loading && search ? (
            <option value="" disabled>No products found matching &quot;{search}&quot;</option>
          ) : (
            filtered.map(d => (
              <option key={d._id} value={d._id}>
                {d.name} {d.brand ? `(${d.brand})` : ''} - ₹{d.price}
              </option>
            ))
          )}
        </select>
        {filtered.length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
        {/* Product Image Display */}
        {selectedProduct && selectedProduct.images && selectedProduct.images.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <div className="border border-black rounded-lg overflow-hidden inline-block">
              <div className="relative w-48 h-48">
                <Image
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                  onError={() => {/* Handle error if needed */}}
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p className="font-medium">{selectedProduct.name}</p>
              {selectedProduct.brand && <p className="text-xs">Brand: {selectedProduct.brand}</p>}
              <p className="text-xs">Price: ₹{selectedProduct.price}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price After Bargaining</label>
          <input 
            type="number" 
            value={form.priceAfterBargain} 
            onChange={(e) => handleChange('priceAfterBargain', Number(e.target.value))} 
            className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
          <input 
            type="number" 
            value={form.advance} 
            onChange={(e) => handleChange('advance', Number(e.target.value))} 
            className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pending Amount</label>
          <input 
            type="number" 
            value={form.pending} 
            onChange={(e) => handleChange('pending', Number(e.target.value))} 
            className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Security Amount</label>
          <input 
            type="number" 
            value={form.securityAmount} 
            onChange={(e) => handleChange('securityAmount', Number(e.target.value))} 
            className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Send Date</label>
          <input 
            type="date" 
            value={form.sendDate ? form.sendDate.split('T')[0] : ''} 
            onChange={(e) => handleChange('sendDate', e.target.value)} 
            className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receive Date</label>
          <input 
            type="date" 
            value={form.receiveDate ? form.receiveDate.split('T')[0] : ''} 
            onChange={(e) => handleChange('receiveDate', e.target.value)} 
            className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
          />
        </div>
      </div>

      <div className="border border-black p-3 rounded">
        <h3 className="font-semibold text-gray-900">Customer Details</h3>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              type="text" 
              value={form.customer?.name || ''} 
              onChange={(e) => handleCustomerChange('name', e.target.value)} 
              className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input 
              type="text" 
              value={form.customer?.mobile || ''} 
              onChange={(e) => handleCustomerChange('mobile', e.target.value)} 
              className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input 
              type="text" 
              value={form.customer?.location || ''} 
              onChange={(e) => handleCustomerChange('location', e.target.value)} 
              className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <ImageUpload value={form.customer?.image || ''} onChange={(url) => handleCustomerChange('image', url)} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reference Customer (optional)</label>
        <input 
          type="text" 
          value={form.referenceCustomer || ''} 
          onChange={(e) => handleChange('referenceCustomer', e.target.value)} 
          className="block w-full rounded-md border border-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2" 
        />
      </div>

      <div className="flex justify-end">
        <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Booking</button>
      </div>
    </div>
  );
};

export default BookingForm;
