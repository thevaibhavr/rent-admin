"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import ImageUpload from './ImageUpload';
import { apiService } from '@/services/api';
import { Product, Booking, Customer } from '@/types';
import toast from 'react-hot-toast';
import {
  UserIcon,
  ScaleIcon,
  CalendarDaysIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  TagIcon,
  CreditCardIcon,
  ClockIcon,
  BanknotesIcon,
  CalculatorIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

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
      const payload: { status: 'active' | 'completed' | 'canceled' } = {
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
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7ede8] text-[#b87570]">
              <UserIcon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">Customer Information</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input 
              type="text" 
              value={form.customer?.name || ''} 
              onChange={(e) => handleCustomerChange('name', e.target.value)} 
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  placeholder="Enter mobile number"
                  required
            />
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
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
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address/Location</label>
            <input 
              type="text" 
              value={form.customer?.location || ''} 
              onChange={(e) => handleCustomerChange('location', e.target.value)} 
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7ede8] text-[#b87570]">
              <ScaleIcon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">Size & Measurements</h2>
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
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  placeholder="S, M, L, XL, etc."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Body Measurements (Optional)</h3>
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
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                    placeholder="150"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency Contact (Optional)</h3>
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
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </div>
        </div>
      </div>

        {/* Booking Details */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7ede8] text-[#b87570]">
              <CalendarDaysIcon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">Booking Details</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                <textarea
                  value={form.deliveryAddress || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  placeholder="If different from customer location"
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30 resize-none"
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
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                      placeholder="Days"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Return Deadline</label>
                    <input
                      type="date"
                      value={form.returnDeadline || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, returnDeadline: e.target.value }))}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    value={form.paymentMethod || 'cash'}
                    onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' | 'online' | 'card' | 'bank_transfer' | 'upi' }))}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Operational Costs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Transport Cost (₹)</label>
                  <input
                    type="number"
                    value={form.items[0]?.transportCost || ''}
                    onChange={(e) => handleItemChange(0, 'transportCost', Number(e.target.value))}
                    placeholder="Cost of transportation"
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Dry Cleaning Cost (₹)</label>
                  <input
                    type="number"
                    value={form.items[0]?.dryCleaningCost || ''}
                    onChange={(e) => handleItemChange(0, 'dryCleaningCost', Number(e.target.value))}
                    placeholder="Cost of dry cleaning"
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30 resize-none"
                rows={3}
              />
            </div>
        </div>
      </div>

        {/* Additional Information */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7ede8] text-[#b87570]">
              <InformationCircleIcon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">Additional Information</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Reference Customer</label>
          <input 
            type="text" 
            value={form.referenceCustomer || ''} 
            onChange={(e) => setForm(prev => ({ ...prev, referenceCustomer: e.target.value }))} 
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30 resize-none"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Customer Notes</label>
                <textarea
                  value={form.customerNotes || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, customerNotes: e.target.value }))}
                  placeholder="Notes from or about the customer"
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30 resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Booking Items */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7ede8] text-[#b87570]">
              <ShoppingBagIcon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">Dress Items ({form.items.length})</h2>
            <button
              onClick={addItem}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f]"
            >
              <PlusIcon className="h-4 w-4" />
              Add Dress
            </button>
        </div>

          <div className="p-6">
            <div className="space-y-6">
        {form.items.map((item, index) => (
                <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-semibold text-gray-900">Item {index + 1}</h3>
              {form.items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                        <TrashIcon className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Product Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product *</label>
                <div className="relative mb-2">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  />
                </div>
                
                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdowns(prev => ({ ...prev, [index]: !prev[index] }))}
                    className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-900 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30 disabled:cursor-not-allowed disabled:opacity-60"
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
                      <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                        {filtered.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
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
                                item.dressId === d._id ? 'bg-[#f7ede8]' : ''
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
                                <div className="truncate font-medium text-gray-900">
                                  {d.name}
                                  {d.brand && <span className="text-gray-500"> ({d.brand})</span>}
                                </div>
                                <div className="text-gray-500">₹{d.price}</div>
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
                    <div className="inline-block overflow-hidden rounded-xl border border-gray-200">
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
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <TagIcon className="h-4 w-4 text-[#b87570]" />
                  Pricing Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Original Price *</label>
                    <input
                      type="number"
                      value={item.originalPrice || ''}
                      onChange={(e) => handleItemChange(index, 'originalPrice', Number(e.target.value))}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700"
                      placeholder="₹0.00"
                    />
                    <p className="text-xs text-gray-500">Auto-calculated</p>
                </div>
                </div>
              </div>

              {/* Payment Fields */}
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CreditCardIcon className="h-4 w-4 text-[#b87570]" />
                  Payment Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Booking Amount</label>
                  <input 
                    type="number" 
                      value={item.bookingAmount || ''}
                      onChange={(e) => handleItemChange(index, 'bookingAmount', Number(e.target.value))}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                      placeholder="₹0.00"
                  />
                    <p className="text-xs text-gray-500">Refundable deposit</p>
                  </div>
                </div>
              </div>

              {/* Booking Timeline & Usage */}
              <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ClockIcon className="h-4 w-4 text-[#b87570]" />
                  Timeline & Usage
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Booking Date *</label>
                    <input
                      type="date"
                      value={item.bookingDate || ''}
                      onChange={(e) => handleItemChange(index, 'bookingDate', e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  />
                    <p className="text-xs text-gray-500">When dress was dispatched</p>
                </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Receive Date</label>
                  <input 
                    type="date" 
                    value={item.receiveDate || ''} 
                    onChange={(e) => handleItemChange(index, 'receiveDate', e.target.value)} 
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  />
                    <p className="text-xs text-gray-500">When dress was returned</p>
              </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Function/Event</label>
                  <input 
                    type="text" 
                    value={item.useDress || ''} 
                    onChange={(e) => handleItemChange(index, 'useDress', e.target.value)} 
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                    />
                    <p className="text-xs text-gray-500">When the event occurs</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Time of Day</label>
                    <select 
                      value={item.useDressTime || ''} 
                      onChange={(e) => handleItemChange(index, 'useDressTime', e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
              <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <BanknotesIcon className="h-4 w-4 text-[#b87570]" />
                    Additional Costs
                  </h4>
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
                    className="inline-flex items-center gap-1 rounded-lg bg-[#b87570] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#a5655f]"
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
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                          className="w-24 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
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
                          className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
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
      </div>

      {/* Totals Summary */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
          <CalculatorIcon className="h-5 w-5 text-[#b87570]" />
          Booking Summary
        </h3>

        {/* Payment Summary */}
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Payment Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Booking Amount</label>
              <div className="text-xl font-bold text-blue-600">₹{totals.totalBookingAmount.toLocaleString()}</div>
          </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
              <div className="text-xl font-bold text-purple-600">₹{totals.totalSecurity.toLocaleString()}</div>
          </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Paid</label>
              <div className="text-xl font-bold text-green-600">₹{totals.totalPaid.toLocaleString()}</div>
          </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pending Amount</label>
              <div className="text-xl font-bold text-yellow-600">₹{totals.totalPending.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Cost Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dress Price</label>
              <div className="text-lg font-bold text-[#633b3b]">₹{totals.totalPrice.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport Costs</label>
              <div className="text-lg font-bold text-orange-600">₹{totals.totalTransportCost.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dry Cleaning</label>
              <div className="text-lg font-bold text-red-600">₹{totals.totalDryCleaningCost.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Costs</label>
              <div className="text-lg font-bold text-pink-600">₹{totals.totalAdditionalCosts.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Operational Costs & Profit */}
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Operational Costs & Profit</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Operational Cost</label>
              <div className="text-lg font-bold text-red-600">₹{totals.totalOperationalCost.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Gross Profit</label>
              <div className={`text-lg font-bold ${(totals.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totals.grossProfit.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Profit</label>
              <div className={`text-lg font-bold ${(totals.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totals.netProfit.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className={`text-lg font-bold ${(totals.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(totals.netProfit || 0) >= 0 ? 'Profit' : 'Loss'}
              </div>
            </div>
          </div>
        </div>

        {/* Profit/Loss Indicator */}
        <div className="mt-4 rounded-xl bg-[#f7ede8] p-3">
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
        <div className="rounded-2xl border border-[#f7ede8] bg-[#f7ede8]/50 p-5 shadow-sm sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
            <BanknotesIcon className="h-5 w-5 text-[#b87570]" />
            Complete Payment
          </h3>

          {/* Payment Summary */}
          <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Payment Summary</h4>
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b87570] px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f]"
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
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7ede8] text-[#b87570]">
              <CheckCircleIcon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">Actions</h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
        <button 
          onClick={handleSubmit} 
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60"
        >
                {initial._id ? 'Update Booking' : 'Create Booking'}
        </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default BookingForm;

