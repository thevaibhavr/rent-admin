"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import ImageUpload from './ImageUpload';
import { apiService } from '@/services/api';
import { Product, Booking } from '@/types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BookingItemFormData {
  dressId: string;
  priceAfterBargain: number;
  advance: number;
  pending: number;
  securityAmount: number;
  sendDate: string;
  receiveDate: string;
  dressImage?: string;
  useDress?: string;
  useDressDate?: string;
  useDressTime?: 'morning' | 'evening';
}

interface BookingFormData {
  items: BookingItemFormData[];
  customer: {
    name: string;
    image?: string;
    location?: string;
    mobile?: string;
  };
  referenceCustomer?: string;
}

interface Props {
  onSaved?: (booking: Booking) => void;
  initial?: Partial<Booking>;
}

const BookingForm: React.FC<Props> = ({ onSaved, initial = {} as Partial<Booking> }) => {
  const [dresses, setDresses] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState<BookingFormData>({
    items: initial.items && initial.items.length > 0 
      ? initial.items.map(item => ({
          dressId: typeof item.dressId === 'string' ? item.dressId : item.dressId._id,
          priceAfterBargain: item.priceAfterBargain ?? 0,
          advance: item.advance ?? 0,
          pending: item.pending ?? 0,
          securityAmount: item.securityAmount ?? 0,
          sendDate: item.sendDate ? item.sendDate.split('T')[0] : '',
          receiveDate: item.receiveDate ? item.receiveDate.split('T')[0] : '',
          dressImage: item.dressImage ?? '',
          useDress: item.useDress ?? '',
          useDressDate: item.useDressDate ? item.useDressDate.split('T')[0] : '',
          useDressTime: item.useDressTime ?? undefined
        }))
      : [{
          dressId: '',
          priceAfterBargain: 0,
          advance: 0,
          pending: 0,
          securityAmount: 0,
          sendDate: '',
          receiveDate: '',
          dressImage: '',
          useDress: ''
        }],
    customer: {
      name: initial.customer?.name ?? '',
      image: initial.customer?.image ?? '',
      location: initial.customer?.location ?? '',
      mobile: initial.customer?.mobile ?? ''
    },
    referenceCustomer: initial.referenceCustomer ?? ''
  });

  // Calculate totals
  const calculateTotals = () => {
    const totals = form.items.reduce(
      (acc, item) => ({
        totalPrice: acc.totalPrice + (item.priceAfterBargain || 0),
        totalAdvance: acc.totalAdvance + (item.advance || 0),
        totalPending: acc.totalPending + (item.pending || 0),
        totalSecurity: acc.totalSecurity + (item.securityAmount || 0)
      }),
      { totalPrice: 0, totalAdvance: 0, totalPending: 0, totalSecurity: 0 }
    );
    return totals;
  };

  const totals = calculateTotals();

  const fetchProducts = useCallback(async (searchTerm: string = '') => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      const response = await apiService.getProducts(1, 100, filters);
      
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
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
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

  const handleItemChange = (index: number, field: keyof BookingItemFormData, value: string | number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          // Auto-calculate pending amount
          if (field === 'priceAfterBargain' || field === 'advance') {
            updated.pending = Math.max(0, (updated.priceAfterBargain || 0) - (updated.advance || 0));
          }
          // Update dress image when dress is selected
          if (field === 'dressId' && typeof value === 'string') {
            const product = dresses.find(p => p._id === value);
            if (product && product.images && product.images.length > 0) {
              updated.dressImage = product.images[0];
            }
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        dressId: '',
        priceAfterBargain: 0,
        advance: 0,
        pending: 0,
        securityAmount: 0,
        sendDate: '',
        receiveDate: '',
        dressImage: '',
        useDress: '',
        useDressDate: '',
        useDressTime: undefined
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length > 1) {
      setForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCustomerChange = (key: keyof BookingFormData['customer'], value: string) => {
    setForm(prev => ({ 
      ...prev, 
      customer: { ...prev.customer, [key]: value } 
    }));
  };

  const handleSubmit = async () => {
    try {
      // Convert form data to API format - remove any _id fields
      const payload: {
        items: Array<{
          dressId: string;
          priceAfterBargain: number;
          advance: number;
          pending: number;
          securityAmount: number;
          sendDate?: string;
          receiveDate?: string;
          dressImage?: string;
          useDress?: string;
          useDressDate?: string;
          useDressTime?: 'morning' | 'evening';
        }>;
        customer: {
          name: string;
          image?: string;
          location?: string;
          mobile?: string;
        };
        referenceCustomer?: string;
      } = {
        items: form.items.map(item => {
          const cleanItem: {
            dressId: string;
            priceAfterBargain: number;
            advance: number;
            pending: number;
            securityAmount: number;
            sendDate?: string;
            receiveDate?: string;
            dressImage?: string;
            useDress?: string;
            useDressDate?: string;
            useDressTime?: 'morning' | 'evening';
          } = {
            dressId: item.dressId,
            priceAfterBargain: item.priceAfterBargain,
            advance: item.advance,
            pending: item.pending,
            securityAmount: item.securityAmount,
            sendDate: item.sendDate || undefined,
            receiveDate: item.receiveDate || undefined,
            dressImage: item.dressImage || undefined,
            useDress: item.useDress || undefined,
            useDressDate: item.useDressDate || undefined,
            useDressTime: item.useDressTime || undefined
          };
          return cleanItem;
        }),
        customer: form.customer,
        referenceCustomer: form.referenceCustomer || undefined
      };

      let booking;
      if (initial._id) {
        // Update existing booking
        booking = await apiService.updateBooking(initial._id, payload);
      } else {
        // Create new booking
        booking = await apiService.createBooking(payload);
      }
      
      if (onSaved) onSaved(booking);
      alert('Booking saved successfully!');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save booking');
    }
  };

  return (
    <div className="space-y-4">
      {/* Customer Details Section */}
      <div className="border border-black p-4 rounded-lg bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Customer Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input 
              type="text" 
              value={form.customer?.name || ''} 
              onChange={(e) => handleCustomerChange('name', e.target.value)} 
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input 
              type="text" 
              value={form.customer?.mobile || ''} 
              onChange={(e) => handleCustomerChange('mobile', e.target.value)} 
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input 
              type="text" 
              value={form.customer?.location || ''} 
              onChange={(e) => handleCustomerChange('location', e.target.value)} 
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Image</label>
            <ImageUpload value={form.customer?.image || ''} onChange={(url) => handleCustomerChange('image', url)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference Customer (optional)</label>
          <input 
            type="text" 
            value={form.referenceCustomer || ''} 
            onChange={(e) => setForm(prev => ({ ...prev, referenceCustomer: e.target.value }))} 
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
          />
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Booking Items</h3>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Dress
          </button>
        </div>

        {form.items.map((item, index) => (
          <div key={index} className="border border-gray-300 p-4 rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
              {form.items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                >
                  <TrashIcon className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Product Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for products..."
                  className="mb-2 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black"
                />
                
                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdowns(prev => ({ ...prev, [index]: !prev[index] }))}
                    className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black text-left"
                    disabled={loading}
                  >
                    <div className="flex items-center gap-2">
                      {item.dressId ? (
                        <>
                          {(() => {
                            const selectedProduct = filtered.find(d => d._id === item.dressId);
                            return selectedProduct?.images && selectedProduct.images.length > 0 ? (
                              <div className="relative w-8 h-8 flex-shrink-0">
                                <Image
                                  src={selectedProduct.images[0]}
                                  alt={selectedProduct.name}
                                  fill
                                  className="object-cover rounded"
                                  onError={() => {}}
                                />
                              </div>
                            ) : null;
                          })()}
                          <span>
                            {(() => {
                              const selectedProduct = filtered.find(d => d._id === item.dressId);
                              return selectedProduct 
                                ? `${selectedProduct.name}${selectedProduct.brand ? ` (${selectedProduct.brand})` : ''} - ₹${selectedProduct.price}`
                                : 'Select Product';
                            })()}
                          </span>
                        </>
                      ) : (
                        <span>-- Select Product --</span>
                      )}
                    </div>
                    <svg
                      className={`h-5 w-5 transition-transform ${openDropdowns[index] ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {openDropdowns[index] && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenDropdowns(prev => ({ ...prev, [index]: false }))}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filtered.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500 text-black">
                            No products found
                          </div>
                        ) : (
                          filtered.map(d => (
                            <button
                              key={d._id}
                              type="button"
                              onClick={() => {
                                handleItemChange(index, 'dressId', d._id);
                                setOpenDropdowns(prev => ({ ...prev, [index]: false }));
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 ${
                                item.dressId === d._id ? 'bg-indigo-50' : ''
                              }`}
                            >
                              {d.images && d.images.length > 0 ? (
                                <div className="relative w-12 h-12 flex-shrink-0">
                                  <Image
                                    src={d.images[0]}
                                    alt={d.name}
                                    fill
                                    className="object-cover rounded border border-gray-200"
                                    onError={() => {}}
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded border border-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-400">No Image</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-black truncate">
                                  {d.name}
                                  {d.brand && <span className="text-gray-600 text-black"> ({d.brand})</span>}
                                </div>
                                <div className="text-gray-600 text-black">₹{d.price}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Product Image Display (below dropdown) */}
                {item.dressImage && (
                  <div className="mt-2">
                    <div className="border border-gray-300 rounded-lg overflow-hidden inline-block">
                      <div className="relative w-32 h-32">
                        <Image
                          src={item.dressImage}
                          alt="Product"
                          fill
                          className="object-cover"
                          onError={() => {}}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price and Financial Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price After Bargaining *</label>
                  <input 
                    type="number" 
                    value={item.priceAfterBargain || ''} 
                    onChange={(e) => handleItemChange(index, 'priceAfterBargain', Number(e.target.value))} 
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
                  <input 
                    type="number" 
                    value={item.advance || ''} 
                    onChange={(e) => handleItemChange(index, 'advance', Number(e.target.value))} 
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pending Amount</label>
                  <input 
                    type="number" 
                    value={item.pending || ''} 
                    readOnly
                    className="block w-full rounded-md border border-gray-300 bg-gray-50 shadow-sm sm:text-sm px-3 py-2 text-black" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated (Price - Advance)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Amount</label>
                  <input 
                    type="number" 
                    value={item.securityAmount || ''} 
                    onChange={(e) => handleItemChange(index, 'securityAmount', Number(e.target.value))} 
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
                  />
                </div>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send Date</label>
                  <input 
                    type="date" 
                    value={item.sendDate || ''} 
                    onChange={(e) => handleItemChange(index, 'sendDate', e.target.value)} 
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receive Date</label>
                  <input 
                    type="date" 
                    value={item.receiveDate || ''} 
                    onChange={(e) => handleItemChange(index, 'receiveDate', e.target.value)} 
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
                  />
                </div>
              </div>

              {/* Use Dress Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Use Dress (e.g., Wedding, Party, etc.)</label>
                  <input 
                    type="text" 
                    value={item.useDress || ''} 
                    onChange={(e) => handleItemChange(index, 'useDress', e.target.value)} 
                    placeholder="Enter the occasion or use for this dress"
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Use Dress Date</label>
                    <input 
                      type="date" 
                      value={item.useDressDate || ''} 
                      onChange={(e) => handleItemChange(index, 'useDressDate', e.target.value)} 
                      className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <select 
                      value={item.useDressTime || ''} 
                      onChange={(e) => handleItemChange(index, 'useDressTime', e.target.value as 'morning' | 'evening' | '')}
                      className="block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black"
                    >
                      <option value="">Select time</option>
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Summary */}
      <div className="border-2 border-indigo-500 p-4 rounded-lg bg-indigo-50">
        <h3 className="font-semibold text-gray-900 mb-3">Total Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (After Bargaining)</label>
            <div className="text-2xl font-bold text-indigo-600">₹{totals.totalPrice.toLocaleString()}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Advance</label>
            <div className="text-2xl font-bold text-green-600">₹{totals.totalAdvance.toLocaleString()}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Pending</label>
            <div className="text-2xl font-bold text-yellow-600">₹{totals.totalPending.toLocaleString()}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Security Deposits</label>
            <div className="text-2xl font-bold text-purple-600">₹{totals.totalSecurity.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSubmit} 
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
        >
          Save Booking
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
