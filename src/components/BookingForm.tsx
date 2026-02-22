"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import ImageUpload from './ImageUpload';
import { apiService } from '@/services/api';
import { Product, Booking, Customer } from '@/types';
import toast from 'react-hot-toast';

interface BookingItemFormData {
  dressId: string;
  originalPrice?: number;
  priceAfterBargain: number;
  discount?: number;

  // Payment tracking
  bookingAmount?: number;
  advance?: number;
  pending?: number;
  finalPayment?: number;
  totalPaid?: number;

  securityAmount?: number;

  // Additional costs
  additionalCosts?: Array<{reason: string, amount: number}>;

  // Transport & Delivery
  sendDate: string;
  deliveryMethod: 'parcel' | 'bus' | 'courier' | 'hand_delivery' | 'other';
  transportCost: number;
  transportPaidBy: 'business' | 'customer';

  // Booking & Timeline
  bookingDate?: string; // Date when dress was booked

  // Usage & Return
  receiveDate: string;
  dressImage?: string;
  useDress?: string; // Function/purpose (wedding, party, etc.)
  useDressDate?: string;
  useDressTime?: 'morning' | 'day' | 'evening';

  // Processing & Quality Check
  dryCleaningCost: number;
  conditionOnReturn: 'excellent' | 'very_good' | 'good' | 'fair' | 'damaged' | 'lost';
  damageDescription: string;
  repairCost: number;
  isRepairable: boolean;

  // Financial calculations (auto-calculated)
  totalCost: number;
  profit: number;
  status: 'booked' | 'paid' | 'sent' | 'delivered' | 'in_use' | 'returned' | 'processing' | 'completed' | 'damaged' | 'lost';
}

interface BookingFormData {
  items: BookingItemFormData[];
  customer: {
    name: string;
    image?: string;
    location?: string;
    mobile?: string;
    email?: string;
    emergencyContact?: {
      name?: string;
      phone?: string;
    };
    measurements?: {
      bust?: number;
      waist?: number;
      hips?: number;
      shoulder?: number;
      length?: number;
      size?: string;
    };
  };
  deliveryAddress?: string;
  rentalDuration?: number; // Number of days
  returnDeadline?: string;
  paymentMethod?: 'cash' | 'online' | 'card' | 'bank_transfer' | 'upi';
  specialInstructions?: string;
  referenceCustomer?: string;
  adminNotes?: string;
  customerNotes?: string;
  status?: 'active' | 'completed' | 'canceled';
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
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const [form, setForm] = useState<BookingFormData>({
    items: initial.items && initial.items.length > 0 
      ? initial.items.map(item => ({
          dressId: typeof item.dressId === 'string' ? item.dressId : item.dressId._id,
          originalPrice: item.originalPrice ?? item.priceAfterBargain ?? 0,
          priceAfterBargain: item.priceAfterBargain ?? 0,
          discount: Math.max(0, (item.originalPrice ?? 0) - (item.priceAfterBargain ?? 0)),

          // Payment tracking
          bookingAmount: item.bookingAmount ?? 0,
          advance: item.advance ?? 0,
          pending: item.pending ?? 0,
          finalPayment: item.finalPayment ?? 0,
          totalPaid: item.totalPaid ?? 0,

          securityAmount: item.securityAmount ?? 0,

          // Additional costs
          additionalCosts: item.additionalCosts ?? [],

          // Booking & Timeline
          bookingDate: item.bookingDate ? (typeof item.bookingDate === 'string' && item.bookingDate.includes('T') ? item.bookingDate.split('T')[0] : item.bookingDate) : new Date().toISOString().split('T')[0],

          // Transport & Delivery
          sendDate: item.sendDate ? item.sendDate.split('T')[0] : '',
          deliveryMethod: item.deliveryMethod ?? 'parcel',
          transportCost: item.transportCost ?? 0,
          transportPaidBy: item.transportPaidBy ?? 'business',

          // Usage & Return
          receiveDate: item.receiveDate ? item.receiveDate.split('T')[0] : '',
          dressImage: item.dressImage ?? '',
          useDress: item.useDress ?? '',
          useDressDate: item.useDressDate ? item.useDressDate.split('T')[0] : '',
          useDressTime: item.useDressTime ?? undefined,

          // Processing & Quality Check
          dryCleaningCost: item.dryCleaningCost ?? 0,
          conditionOnReturn: item.conditionOnReturn ?? 'good',
          damageDescription: item.damageDescription ?? '',
          repairCost: item.repairCost ?? 0,
          isRepairable: item.isRepairable ?? true,

          // Financial calculations
          totalCost: item.totalCost ?? 0,
          profit: item.profit ?? 0,
          status: item.status ?? 'booked'
        }))
      : [{
          dressId: '',
          priceAfterBargain: 0,

          // Payment tracking
          bookingAmount: 0,
          advance: 0,
          pending: 0,
          finalPayment: 0,
          totalPaid: 0,

          securityAmount: 0,

          // Transport & Delivery
          sendDate: '',
          deliveryMethod: 'parcel',
          transportCost: 0,
          transportPaidBy: 'business',

          // Usage & Return
          receiveDate: '',
          dressImage: '',
          useDress: '',
          useDressDate: '',
          useDressTime: undefined,

          // Processing & Quality Check
          dryCleaningCost: 0,
          conditionOnReturn: 'good',
          damageDescription: '',
          repairCost: 0,
          isRepairable: true,

          // Financial calculations
          totalCost: 0,
          profit: 0,
          status: 'booked'
        }],
    customer: {
      name: initial.customer?.name ?? '',
      image: initial.customer?.image ?? '',
      location: initial.customer?.location ?? '',
      mobile: initial.customer?.mobile ?? '',
      email: initial.customer?.email ?? '',
      emergencyContact: initial.customer?.emergencyContact ?? { name: '', phone: '' },
      measurements: {
        bust: initial.customer?.measurements?.bust ?? undefined,
        waist: initial.customer?.measurements?.waist ?? undefined,
        hips: initial.customer?.measurements?.hips ?? undefined,
        shoulder: initial.customer?.measurements?.shoulder ?? undefined,
        length: initial.customer?.measurements?.length ?? undefined,
        size: initial.customer?.measurements?.size ?? ''
      }
    },
    deliveryAddress: initial.deliveryAddress ?? '',
    rentalDuration: initial.rentalDuration ?? 1,
    returnDeadline: initial.returnDeadline ? (typeof initial.returnDeadline === 'string' && initial.returnDeadline.includes('T') ? initial.returnDeadline.split('T')[0] : initial.returnDeadline) : '',
    paymentMethod: initial.paymentMethod ?? 'cash',
    specialInstructions: initial.specialInstructions ?? '',
    referenceCustomer: initial.referenceCustomer ?? '',
    adminNotes: initial.adminNotes ?? '',
    customerNotes: initial.customerNotes ?? '',
    status: initial.status ?? 'active'
  });

  // Calculate totals
  const calculateTotals = () => {
    const totals = form.items.reduce(
      (acc, item) => ({
        totalPrice: acc.totalPrice + (item.priceAfterBargain || 0),
        totalBookingAmount: acc.totalBookingAmount + (item.bookingAmount || 0),
        totalAdvance: acc.totalAdvance + (item.advance || 0),
        totalFinalPayment: acc.totalFinalPayment + (item.finalPayment || 0),
        totalPaid: acc.totalPaid + (item.totalPaid || 0),
        totalPending: acc.totalPending + (item.pending || 0),
        totalSecurity: acc.totalSecurity + (item.securityAmount || 0),
        totalTransportCost: acc.totalTransportCost + (item.transportCost || 0),
        totalDryCleaningCost: acc.totalDryCleaningCost + (item.dryCleaningCost || 0),
        totalRepairCost: acc.totalRepairCost + (item.repairCost || 0),
        totalAdditionalCosts: acc.totalAdditionalCosts + (item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0),
        totalOperationalCost: acc.totalOperationalCost + (item.transportCost || 0) + (item.dryCleaningCost || 0) + (item.repairCost || 0) + (item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0),
        grossProfit: acc.grossProfit + (item.totalPaid || 0) - (item.priceAfterBargain || 0),
        netProfit: acc.netProfit + ((item.totalPaid || 0) - (item.priceAfterBargain || 0) - ((item.transportCost || 0) + (item.dryCleaningCost || 0) + (item.repairCost || 0) + (item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0)))
      }),
      {
        totalPrice: 0,
        totalBookingAmount: 0,
        totalAdvance: 0,
        totalFinalPayment: 0,
        totalPaid: 0,
        totalPending: 0,
        totalSecurity: 0,
        totalTransportCost: 0,
        totalDryCleaningCost: 0,
        totalRepairCost: 0,
        totalAdditionalCosts: 0,
        totalOperationalCost: 0,
        grossProfit: 0,
        netProfit: 0
      }
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

  // Update form when initial data changes (for editing)
  useEffect(() => {
    if (initial._id) {
      setForm({
        items: initial.items && initial.items.length > 0
          ? (initial.items.map(item => {
              const dressId = typeof item.dressId === 'string' ? item.dressId : item.dressId._id;
              // Get the product's actual price from the dresses array, or fall back to stored value
              const selectedProduct = dresses.find(d => d._id === dressId);
              const productPrice = selectedProduct?.price || item.originalPrice || item.priceAfterBargain || 0;

              return {
                dressId,
                originalPrice: productPrice, // Use the product's actual price
                priceAfterBargain: item.priceAfterBargain ?? 0,
                discount: Math.max(0, productPrice - (item.priceAfterBargain ?? 0)), // Recalculate discount

                // Payment tracking
                bookingAmount: item.bookingAmount ?? 0,
                advance: item.advance ?? 0,
                pending: item.pending ?? 0,
                finalPayment: item.finalPayment ?? 0,
                totalPaid: item.totalPaid ?? 0,

                securityAmount: item.securityAmount ?? 0,

                // Additional costs
                additionalCosts: item.additionalCosts ?? [],

                // Booking & Timeline
                bookingDate: item.bookingDate ? (typeof item.bookingDate === 'string' && item.bookingDate.includes('T') ? item.bookingDate.split('T')[0] : item.bookingDate) : new Date().toISOString().split('T')[0],

                // Transport & Delivery
                sendDate: item.sendDate ? item.sendDate.split('T')[0] : '',
                deliveryMethod: item.deliveryMethod ?? 'parcel',
                transportCost: item.transportCost ?? 0,
                transportPaidBy: item.transportPaidBy ?? 'business',

                // Usage & Return
                receiveDate: item.receiveDate ? item.receiveDate.split('T')[0] : '',
                dressImage: item.dressImage ?? '',
                useDress: item.useDress ?? '',
                useDressDate: item.useDressDate ? item.useDressDate.split('T')[0] : '',
                useDressTime: item.useDressTime ?? undefined,

                // Processing & Quality Check
                dryCleaningCost: item.dryCleaningCost ?? 0,
                conditionOnReturn: item.conditionOnReturn ?? 'good',
                damageDescription: item.damageDescription ?? '',
                repairCost: item.repairCost ?? 0,
                isRepairable: item.isRepairable ?? true,

                // Financial calculations
                totalCost: item.totalCost ?? 0,
                profit: item.profit ?? 0,
                status: item.status ?? 'booked'
              };
            }))
          : [{
              dressId: '',
              priceAfterBargain: 0,

              // Payment tracking
              bookingAmount: 0,
              advance: 0,
              pending: 0,
              finalPayment: 0,
              totalPaid: 0,

              securityAmount: 0,

              // Transport & Delivery
              sendDate: '',
              deliveryMethod: 'parcel',
              transportCost: 0,
              transportPaidBy: 'business',

              // Usage & Return
              receiveDate: '',
              dressImage: '',
              useDress: '',
              useDressDate: '',
              useDressTime: undefined,

              // Processing & Quality Check
              dryCleaningCost: 0,
              conditionOnReturn: 'good',
              damageDescription: '',
              repairCost: 0,
              isRepairable: true,

              // Financial calculations
              totalCost: 0,
              profit: 0,
              status: 'booked'
            }],
        customer: {
          name: initial.customer?.name ?? '',
          image: initial.customer?.image ?? '',
          location: initial.customer?.location ?? '',
          mobile: initial.customer?.mobile ?? '',
          email: initial.customer?.email ?? '',
          emergencyContact: initial.customer?.emergencyContact ?? { name: '', phone: '' },
          measurements: {
            bust: initial.customer?.measurements?.bust ?? undefined,
            waist: initial.customer?.measurements?.waist ?? undefined,
            hips: initial.customer?.measurements?.hips ?? undefined,
            shoulder: initial.customer?.measurements?.shoulder ?? undefined,
            length: initial.customer?.measurements?.length ?? undefined,
            size: initial.customer?.measurements?.size ?? ''
          }
        },
        deliveryAddress: initial.deliveryAddress ?? '',
        rentalDuration: initial.rentalDuration ?? 1,
        returnDeadline: initial.returnDeadline ? (typeof initial.returnDeadline === 'string' && initial.returnDeadline.includes('T') ? initial.returnDeadline.split('T')[0] : initial.returnDeadline) : '',
        paymentMethod: initial.paymentMethod ?? 'cash',
        specialInstructions: initial.specialInstructions ?? '',
        referenceCustomer: initial.referenceCustomer ?? '',
        adminNotes: initial.adminNotes ?? '',
        customerNotes: initial.customerNotes ?? '',
        status: initial.status ?? 'active'
      });
    }
  }, [initial, dresses]);

  const filtered = dresses.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase()) ||
    d.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleItemChange = (index: number, field: keyof BookingItemFormData, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };

          // Auto-calculate financial values
          if (['bookingAmount', 'advance', 'finalPayment'].includes(field)) {
            // Recalculate total paid
            updated.totalPaid = (updated.bookingAmount || 0) + (updated.advance || 0) + (updated.finalPayment || 0);
            // Recalculate pending amount
            updated.pending = Math.max(0, (updated.priceAfterBargain || 0) - (updated.totalPaid || 0));
          }

          // Calculate discount when original price or final price changes
          if (['originalPrice', 'priceAfterBargain'].includes(field)) {
            updated.discount = Math.max(0, (updated.originalPrice || 0) - (updated.priceAfterBargain || 0));
            // Recalculate pending amount based on new final price
            updated.pending = Math.max(0, (updated.priceAfterBargain || 0) - (updated.totalPaid || 0));
          }

          if (['transportCost', 'dryCleaningCost', 'repairCost'].includes(field)) {
            // Recalculate total cost
            updated.totalCost = (updated.transportCost || 0) + (updated.dryCleaningCost || 0) + (updated.repairCost || 0);
            // Recalculate profit
            updated.profit = (updated.totalPaid || 0) - (updated.totalCost || 0);
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
        originalPrice: 0,
        priceAfterBargain: 0,
        discount: 0,

        // Payment tracking
        bookingAmount: 0,
        advance: 0,
        pending: 0,
        finalPayment: 0,
        totalPaid: 0,

        securityAmount: 0,

        // Additional costs
        additionalCosts: [],

        // Booking & Timeline
        bookingDate: new Date().toISOString().split('T')[0],

        // Transport & Delivery
        sendDate: '',
        deliveryMethod: 'parcel',
        transportCost: 0,
        transportPaidBy: 'business',

        // Usage & Return
        receiveDate: '',
        dressImage: '',
        useDress: '',
        useDressDate: '',
        useDressTime: undefined,

        // Processing & Quality Check
        dryCleaningCost: 0,
        conditionOnReturn: 'good',
        damageDescription: '',
        repairCost: 0,
        isRepairable: true,

        // Financial calculations
        totalCost: 0,
        profit: 0,
        status: 'booked'
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

  const handleCustomerChange = async (key: keyof BookingFormData['customer'], value: string) => {
    setForm(prev => ({
      ...prev,
      customer: { ...prev.customer, [key]: value }
    }));

    // Search for customer suggestions when mobile changes
    if (key === 'mobile' && value.length >= 3) {
      try {
        const response = await apiService.searchCustomers(value);
        setCustomerSuggestions(response.customers || []);
        setShowCustomerSuggestions(true);
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
      }
    } else if (key === 'mobile' && value.length < 3) {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
    }
  };

  const selectCustomerSuggestion = (customer: Customer) => {
    setForm(prev => ({
      ...prev,
      customer: {
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email || '',
        location: customer.location || '',
        emergencyContact: customer.emergencyContact || { name: '', phone: '' },
        measurements: customer.measurements || {
          bust: undefined,
          waist: undefined,
          hips: undefined,
          shoulder: undefined,
          length: undefined,
          size: ''
        }
      }
    }));
    setShowCustomerSuggestions(false);
  };

  const handleCompletePayment = async () => {
    try {
      // Create payload to mark booking as completed
      const payload = {
        status: 'completed'
      };

      // Update existing booking to mark as completed
      const booking = await apiService.updateBooking(initial._id!, payload);

      if (onSaved) onSaved(booking);

      // Use the returned booking data for accurate calculations
      const finalEarnings = booking.totalPaid || 0;
      const finalExpenses = booking.totalOperationalCost || 0;
      const netProfit = booking.netProfit || 0;

      toast.success(
        <div className="text-left">
          <div className="font-semibold text-green-800 mb-2">✅ Payment Marked as Completed!</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Total Earned:</span>
              <span className="font-semibold text-green-600">₹{finalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Spent:</span>
              <span className="font-semibold text-red-600">₹{finalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-green-300">
              <span>Net Profit:</span>
              <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>,
        { duration: 6000 }
      );

      // Trigger dashboard refresh
      localStorage.setItem('dashboardRefreshNeeded', Date.now().toString());
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to complete payment');
    }
  };

  const handleSubmit = async () => {
    try {
      // Convert form data to API format - remove any _id fields
      const payload = {
        items: form.items.map(item => {
          const cleanItem = {
            dressId: item.dressId,
            originalPrice: item.originalPrice || 0,
            priceAfterBargain: item.priceAfterBargain,
            discount: item.discount || 0,
            bookingAmount: item.bookingAmount || 0,
            advance: item.advance || 0,
            pending: item.pending || 0,
            finalPayment: item.finalPayment || 0,
            totalPaid: item.totalPaid || 0,
            securityAmount: item.securityAmount || 0,
            additionalCosts: item.additionalCosts || [],
            bookingDate: item.bookingDate || undefined,
            sendDate: item.sendDate || undefined,
            deliveryMethod: item.deliveryMethod,
            transportCost: item.transportCost,
            transportPaidBy: item.transportPaidBy,
            receiveDate: item.receiveDate || undefined,
            dressImage: item.dressImage || undefined,
            useDress: item.useDress || undefined,
            useDressDate: item.useDressDate || undefined,
            useDressTime: item.useDressTime || undefined,
            dryCleaningCost: item.dryCleaningCost,
            conditionOnReturn: item.conditionOnReturn,
            damageDescription: item.damageDescription,
            repairCost: item.repairCost,
            isRepairable: item.isRepairable,
            totalCost: item.totalCost,
            profit: item.profit,
            status: item.status
          };
          return cleanItem;
        }),
        customer: form.customer,
        deliveryAddress: form.deliveryAddress || undefined,
        rentalDuration: form.rentalDuration || undefined,
        returnDeadline: form.returnDeadline || undefined,
        paymentMethod: form.paymentMethod || undefined,
        specialInstructions: form.specialInstructions || undefined,
        referenceCustomer: form.referenceCustomer || undefined,
        adminNotes: form.adminNotes || undefined,
        customerNotes: form.customerNotes || undefined,
        status: form.status
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
      toast.success('Booking saved successfully!');

      // Trigger dashboard refresh
      localStorage.setItem('dashboardRefreshNeeded', Date.now().toString());
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to save booking');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {initial._id ? 'Edit Booking' : 'Create New Booking'}
        </h1>
        <p className="text-gray-600">
          {initial._id ? 'Update booking details and track progress' : 'Fill in the details to create a new rental booking'}
        </p>
      </div>

      <div className="space-y-8">
        {/* Basic Customer Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </span>
              Customer Information
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input 
              type="text" 
              value={form.customer?.name || ''} 
              onChange={(e) => handleCustomerChange('name', e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter customer name"
              required
            />
          </div>

              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
            <input
                  type="tel"
              value={form.customer?.mobile || ''}
              onChange={(e) => handleCustomerChange('mobile', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter mobile number"
                  required
            />
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {customerSuggestions.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onClick={() => selectCustomerSuggestion(customer)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.mobile}</div>
                        {customer.email && (
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
          </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={form.customer?.email || ''}
                  onChange={(e) => handleCustomerChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address/Location</label>
            <input 
              type="text" 
              value={form.customer?.location || ''} 
              onChange={(e) => handleCustomerChange('location', e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter address or location"
            />
          </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Customer Photo</label>
                <ImageUpload
                  value={form.customer?.image || ''}
                  onChange={(url) => handleCustomerChange('image', url)}
                />
          </div>
        </div>

        </div>
        </div>

        {/* Size & Measurements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              Size & Measurements
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Dress Size</label>
                <input
                  type="text"
                  value={form.customer?.measurements?.size || ''}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    customer: {
                      ...prev.customer,
                      measurements: {
                        ...prev.customer?.measurements,
                        size: e.target.value
                      }
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="S, M, L, XL, etc."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Body Measurements (Optional)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Bust (cm)</label>
                  <input
                    type="number"
                    value={form.customer?.measurements?.bust || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        measurements: {
                          ...prev.customer?.measurements,
                          bust: Number(e.target.value) || undefined
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    placeholder="85"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Waist (cm)</label>
                  <input
                    type="number"
                    value={form.customer?.measurements?.waist || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        measurements: {
                          ...prev.customer?.measurements,
                          waist: Number(e.target.value) || undefined
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    placeholder="65"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Hips (cm)</label>
                  <input
                    type="number"
                    value={form.customer?.measurements?.hips || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        measurements: {
                          ...prev.customer?.measurements,
                          hips: Number(e.target.value) || undefined
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    placeholder="90"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Shoulder (cm)</label>
                  <input
                    type="number"
                    value={form.customer?.measurements?.shoulder || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        measurements: {
                          ...prev.customer?.measurements,
                          shoulder: Number(e.target.value) || undefined
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    placeholder="35"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Length (cm)</label>
                  <input
                    type="number"
                    value={form.customer?.measurements?.length || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        measurements: {
                          ...prev.customer?.measurements,
                          length: Number(e.target.value) || undefined
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    placeholder="150"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-4">Emergency Contact (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                  <input
                    type="text"
                    value={form.customer?.emergencyContact?.name || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        emergencyContact: {
                          ...prev.customer?.emergencyContact,
                          name: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="tel"
                    value={form.customer?.emergencyContact?.phone || ''}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        emergencyContact: {
                          ...prev.customer?.emergencyContact,
                          phone: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </span>
              Booking Details
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                <textarea
                  value={form.deliveryAddress || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  placeholder="If different from customer location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Rental Duration</label>
                    <input
                      type="number"
                      value={form.rentalDuration || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, rentalDuration: Number(e.target.value) }))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Days"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Return Deadline</label>
                    <input
                      type="date"
                      value={form.returnDeadline || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, returnDeadline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    value={form.paymentMethod || 'cash'}
                    onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' | 'online' | 'card' | 'bank_transfer' | 'upi' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="online">💳 Online Transfer</option>
                    <option value="card">💳 Credit/Debit Card</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="upi">📱 UPI</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Operational Costs */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-4">Operational Costs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Transport Cost (₹)</label>
                  <input
                    type="number"
                    value={form.items[0]?.transportCost || ''}
                    onChange={(e) => handleItemChange(0, 'transportCost', Number(e.target.value))}
                    placeholder="Cost of transportation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Dry Cleaning Cost (₹)</label>
                  <input
                    type="number"
                    value={form.items[0]?.dryCleaningCost || ''}
                    onChange={(e) => handleItemChange(0, 'dryCleaningCost', Number(e.target.value))}
                    placeholder="Cost of dry cleaning"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
              <textarea
                value={form.specialInstructions || ''}
                onChange={(e) => setForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                placeholder="Care instructions, delivery preferences, special requests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
              Additional Information
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Reference Customer</label>
          <input 
            type="text" 
            value={form.referenceCustomer || ''} 
            onChange={(e) => setForm(prev => ({ ...prev, referenceCustomer: e.target.value }))} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  placeholder="Referred by..."
          />
        </div>
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                <textarea
                  value={form.adminNotes || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Internal notes for admin reference"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors resize-none"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Customer Notes</label>
                <textarea
                  value={form.customerNotes || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, customerNotes: e.target.value }))}
                  placeholder="Notes from or about the customer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Booking Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </span>
                Dress Items ({form.items.length})
              </h2>
          <button
            onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            Add Dress
          </button>
            </div>
        </div>

          <div className="p-6">
            <div className="space-y-6">
        {form.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Item {index + 1}</h3>
              {form.items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Product Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product *</label>
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
                            const selectedProduct = dresses.find(d => d._id === item.dressId);
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
                              const selectedProduct = dresses.find(d => d._id === item.dressId);
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
                                handleItemChange(index, 'originalPrice', d.price || 0);
                                handleItemChange(index, 'priceAfterBargain', d.price || 0);
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
                {item.dressId && (() => {
                  const selectedProduct = dresses.find(d => d._id === item.dressId);
                  return selectedProduct?.images && selectedProduct.images.length > 0 ? (
                  <div className="mt-2">
                    <div className="border border-gray-300 rounded-lg overflow-hidden inline-block">
                      <div className="relative w-32 h-32">
                        <Image
                            src={selectedProduct.images[0]}
                            alt="Selected product"
                          fill
                          className="object-cover"
                          onError={() => {}}
                        />
                      </div>
                    </div>
                  </div>
                  ) : null;
                })()}
              </div>

              {/* Price Fields */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </span>
                  Pricing Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Original Price *</label>
                    <input
                      type="number"
                      value={item.originalPrice || ''}
                      onChange={(e) => handleItemChange(index, 'originalPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="₹0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Dress Price *</label>
                  <input 
                    type="number" 
                    value={item.priceAfterBargain || ''} 
                    onChange={(e) => handleItemChange(index, 'priceAfterBargain', Number(e.target.value))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="₹0.00"
                    required
                  />
                </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Discount</label>
                  <input 
                    type="number" 
                      value={item.discount || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-700"
                      placeholder="₹0.00"
                    />
                    <p className="text-xs text-gray-500">Auto-calculated</p>
                </div>
                </div>
              </div>

              {/* Payment Fields */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </span>
                  Payment Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Booking Amount</label>
                  <input 
                    type="number" 
                      value={item.bookingAmount || ''}
                      onChange={(e) => handleItemChange(index, 'bookingAmount', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="₹0.00"
                    />
                    <p className="text-xs text-gray-500">Initial payment to book</p>
                </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Security Deposit</label>
                  <input 
                    type="number" 
                    value={item.securityAmount || ''} 
                    onChange={(e) => handleItemChange(index, 'securityAmount', Number(e.target.value))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="₹0.00"
                  />
                    <p className="text-xs text-gray-500">Refundable deposit</p>
                  </div>
                </div>
              </div>

              {/* Booking Timeline & Usage */}
              <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Timeline & Usage
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Booking Date *</label>
                    <input
                      type="date"
                      value={item.bookingDate || ''}
                      onChange={(e) => handleItemChange(index, 'bookingDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      required
                    />
                    <p className="text-xs text-gray-500">When the booking was made</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Send Date</label>
                  <input 
                    type="date" 
                    value={item.sendDate || ''} 
                    onChange={(e) => handleItemChange(index, 'sendDate', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                    <p className="text-xs text-gray-500">When dress was dispatched</p>
                </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Receive Date</label>
                  <input 
                    type="date" 
                    value={item.receiveDate || ''} 
                    onChange={(e) => handleItemChange(index, 'receiveDate', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                    <p className="text-xs text-gray-500">When dress was returned</p>
              </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Function/Event</label>
                  <input 
                    type="text" 
                    value={item.useDress || ''} 
                    onChange={(e) => handleItemChange(index, 'useDress', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Wedding, Party, etc."
                  />
                    <p className="text-xs text-gray-500">Occasion for renting</p>
                </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Event Date</label>
                    <input 
                      type="date" 
                      value={item.useDressDate || ''} 
                      onChange={(e) => handleItemChange(index, 'useDressDate', e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500">When the event occurs</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Time of Day</label>
                    <select 
                      value={item.useDressTime || ''} 
                      onChange={(e) => handleItemChange(index, 'useDressTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select time</option>
                      <option value="morning">🌅 Morning</option>
                      <option value="day">☀️ Day</option>
                      <option value="evening">🌙 Evening</option>
                    </select>
                    <p className="text-xs text-gray-500">Time slot for the event</p>
                  </div>
                </div>
              </div>

              {/* Additional Costs */}
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">Additional Costs</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newCost = { reason: '', amount: 0 };
                      setForm(prev => ({
                        ...prev,
                        items: prev.items.map((item, i) =>
                          i === index
                            ? { ...item, additionalCosts: [...(item.additionalCosts || []), newCost] }
                            : item
                        )
                      }));
                    }}
                    className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                  >
                    + Add Cost
                  </button>
            </div>

                {item.additionalCosts && item.additionalCosts.length > 0 && (
                  <div className="space-y-2">
                    {item.additionalCosts.map((cost, costIndex) => (
                      <div key={costIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cost.reason}
                          onChange={(e) => {
                            const newCosts = [...(item.additionalCosts || [])];
                            newCosts[costIndex].reason = e.target.value;
                            setForm(prev => ({
                              ...prev,
                              items: prev.items.map((item, i) =>
                                i === index ? { ...item, additionalCosts: newCosts } : item
                              )
                            }));
                          }}
                          placeholder="Reason for cost"
                          className="flex-1 rounded-md border border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 text-black"
                        />
                        <input
                          type="number"
                          value={cost.amount || ''}
                          onChange={(e) => {
                            const newCosts = [...(item.additionalCosts || [])];
                            newCosts[costIndex].amount = Number(e.target.value);
                            setForm(prev => ({
                              ...prev,
                              items: prev.items.map((item, i) =>
                                i === index ? { ...item, additionalCosts: newCosts } : item
                              )
                            }));
                          }}
                          placeholder="Amount (₹)"
                          className="w-24 rounded-md border border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 text-black"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newCosts = (item.additionalCosts || []).filter((_, i) => i !== costIndex);
                            setForm(prev => ({
                              ...prev,
                              items: prev.items.map((item, i) =>
                                i === index ? { ...item, additionalCosts: newCosts } : item
                              )
                            }));
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
          </div>
        ))}
                  </div>
                )}
              </div>
                </div>
                </div>
          ))}
        </div>
      </div>

      {/* Totals Summary */}
      <div className="border-2 border-indigo-500 p-6 rounded-lg bg-indigo-50">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>

        {/* Payment Summary */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Payment Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Booking Amount</label>
              <div className="text-xl font-bold text-blue-600">₹{totals.totalBookingAmount.toLocaleString()}</div>
          </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
              <div className="text-xl font-bold text-purple-600">₹{totals.totalSecurity.toLocaleString()}</div>
          </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Paid</label>
              <div className="text-xl font-bold text-green-600">₹{totals.totalPaid.toLocaleString()}</div>
          </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pending Amount</label>
              <div className="text-xl font-bold text-yellow-600">₹{totals.totalPending.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Cost Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dress Price</label>
              <div className="text-lg font-bold text-indigo-600">₹{totals.totalPrice.toLocaleString()}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport Costs</label>
              <div className="text-lg font-bold text-orange-600">₹{totals.totalTransportCost.toLocaleString()}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dry Cleaning</label>
              <div className="text-lg font-bold text-red-600">₹{totals.totalDryCleaningCost.toLocaleString()}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Costs</label>
              <div className="text-lg font-bold text-pink-600">₹{totals.totalAdditionalCosts.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Operational Costs & Profit */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Operational Costs & Profit</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Operational Cost</label>
              <div className="text-lg font-bold text-red-600">₹{totals.totalOperationalCost.toLocaleString()}</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Gross Profit</label>
              <div className={`text-lg font-bold ${(totals.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totals.grossProfit.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Profit</label>
              <div className={`text-lg font-bold ${(totals.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totals.netProfit.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className={`text-lg font-bold ${(totals.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(totals.netProfit || 0) >= 0 ? 'Profit' : 'Loss'}
              </div>
            </div>
          </div>
        </div>

        {/* Profit/Loss Indicator */}
        <div className="mt-4 p-3 rounded-lg bg-white border">
          <div className="flex items-center justify-between">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overall Status</label>
              <div className={`text-lg font-bold ${totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totals.netProfit >= 0 ? 'Profit' : 'Loss'} of ₹{Math.abs(totals.netProfit).toLocaleString()}
          </div>
          </div>
            <div className={`text-3xl ${totals.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totals.netProfit >= 0 ? '📈' : '📉'}
          </div>
          </div>
        </div>
      </div>

      {/* Complete Payment Section */}
      {initial._id && initial.status !== 'canceled' && initial.status !== 'completed' && (
        <div className="border-2 border-green-500 p-6 rounded-lg bg-green-50">
          <h3 className="font-semibold text-gray-900 mb-4">Complete Payment</h3>

          {/* Payment Summary */}
          <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
                <span className="text-gray-600">Total Amount:</span>
                <div className="font-semibold text-gray-900">₹{totals.totalPrice.toLocaleString()}</div>
          </div>
          <div>
                <span className="text-gray-600">Paid So Far:</span>
                <div className="font-semibold text-blue-600">₹{totals.totalPaid.toLocaleString()}</div>
          </div>
          <div>
                <span className="text-gray-600">Remaining:</span>
                <div className="font-semibold text-red-600">₹{(totals.totalPrice - totals.totalPaid).toLocaleString()}</div>
          </div>
        </div>
      </div>

          <div className="flex justify-center">
            <button
              onClick={handleCompletePayment}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200"
              title="Mark payment as completed"
            >
              ✅ Mark Payment as Completed
            </button>
          </div>
          <div className="mt-3 text-center text-sm text-gray-600">
            This will mark the booking payment as fully completed and update all calculations.
          </div>
        </div>
      )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
              Actions
            </h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
        <button 
          onClick={handleSubmit} 
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
                {initial._id ? 'Update Booking' : 'Create Booking'}
        </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;

