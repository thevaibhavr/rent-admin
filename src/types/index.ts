export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  _id: string;
  name: string;
  mobilenumber?: number;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSize {
  size: string;
  isAvailable: boolean;
  quantity: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: Category;
  categories: Category[];
  Owner?: Merchant;
  images: string[];
  price?: number;
  merchantPrice?: number;
  originalPrice: number;
  packOf?: number;
  deposit?: number;
  sizes: ProductSize[];
  color?: string;
  brand?: string;
  material?: string;
  condition?: 'Excellent' | 'Very Good' | 'Good' | 'Fair';
  rentalDuration?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isHighlighted: boolean;
  highlightOrder: number;
  tags: string[];
  specifications?: Record<string, string>;
  careInstructions?: string;
  slug: string;
  views: number;
  rating: number;
  numReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  rentalDuration: number;
  price: number;
  totalPrice: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  _id: string;
  user: User;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'PayPal' | 'Cash on Delivery';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Returned' | 'Cancelled';
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  orderNumber: string;
  rentalStartDate: string;
  rentalEndDate: string;
  notes?: string;
  adminNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[] | number;
    totalPages: number;
    currentPage: number;
    total: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  // Booking statistics
  totalBookings?: number;
  totalCustomers?: number;
  newCustomers?: number;
  repeatCustomers?: number;
  totalAdvance?: number;
  totalPending?: number;
  totalSecurity?: number;
  totalPaid?: number; // Total amount paid for completed bookings
  totalBookingAmount?: number; // Total booking amounts collected
  totalFinalPayment?: number; // Total final payments
  totalTransportCost?: number; // Total transport costs
  totalDryCleaningCost?: number; // Total dry cleaning costs
  totalRepairCost?: number; // Total repair costs
  totalOperationalCost?: number; // Total operational costs
  grossProfit?: number; // Total gross profit
  netProfit?: number; // Total net profit
  activeBookings?: number;
  completedBookings?: number;
  canceledBookings?: number;
  pendingBookings?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  image: string;
  sortOrder?: number;
}

export interface CreateProductData {
  name: string;
  description: string;
  categories: string[];
  Owner?: string;
  images: string[];
  price?: number;
  merchantPrice?: number;
  originalPrice: number;
  packOf?: number;
  deposit?: number;
  sizes: ProductSize[];
  color?: string;
  rentalDuration?: number;
  condition?: 'Excellent' | 'Very Good' | 'Good' | 'Fair';
  brand?: string;
  material?: string;
  tags?: string[];
  careInstructions?: string;
  isFeatured?: boolean;
  specifications?: Record<string, string>;
}

export interface CreateMerchantData {
  name: string;
  mobilenumber?: number;
  address?: string;
}

export interface UpdateOrderStatusData {
  orderStatus: Order['orderStatus'];
  paymentStatus?: Order['paymentStatus'];
  adminNotes?: string;
} 

export interface BookingCustomer {
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
}

export interface BookingItem {
  dressId: string | Product;
  originalPrice?: number;
  priceAfterBargain: number;
  discount?: number;

  // Payment tracking
  bookingAmount?: number; // Initial booking payment
  advance?: number; // Additional advance payments
  pending?: number; // Remaining amount to be paid
  finalPayment?: number; // Full payment made before delivery
  totalPaid?: number; // Total amount received

  securityAmount?: number;

  // Additional costs
  additionalCosts?: Array<{reason: string, amount: number}>;

  // Booking & Timeline
  bookingDate?: string;

  // Transport & Delivery
  sendDate?: string;
  deliveryMethod?: 'parcel' | 'bus' | 'courier' | 'hand_delivery' | 'other';
  transportCost?: number; // Cost of transportation
  transportPaidBy?: 'business' | 'customer';

  // Usage & Return
  receiveDate?: string;
  dressImage?: string;
  useDress?: string;
  useDressDate?: string;
  useDressTime?: 'morning' | 'day' | 'evening';

  // Processing & Quality Check
  dryCleaningCost?: number;
  conditionOnReturn?: 'excellent' | 'very_good' | 'good' | 'fair' | 'damaged' | 'lost';
  damageDescription?: string;
  repairCost?: number;
  isRepairable?: boolean;

  // Financial calculations
  totalCost?: number; // transportCost + dryCleaningCost + repairCost
  profit?: number; // totalPaid - totalCost
  status?: 'booked' | 'paid' | 'sent' | 'delivered' | 'in_use' | 'returned' | 'processing' | 'completed' | 'damaged' | 'lost';
}

export interface Customer {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  location?: string;
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
  avatar?: string;
  notes?: string;
  totalBookings?: number;
  totalSpent?: number;
  lastBookingDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  bookingId: string;
  items?: BookingItem[];

  // Legacy fields for backward compatibility
  dressId?: string | Product;
  priceAfterBargain?: number;
  advance?: number;
  pending?: number;
  securityAmount?: number;
  sendDate?: string;
  receiveDate?: string;
  dressImage?: string;

  // Common fields
  customer: BookingCustomer;
  deliveryAddress?: string;
  rentalDuration?: number;
  returnDeadline?: string;
  paymentMethod?: 'cash' | 'online' | 'card' | 'bank_transfer' | 'upi';
  specialInstructions?: string;
  referenceCustomer?: string;

  // Workflow status
  status?: 'active' | 'completed' | 'canceled';
  canceledAt?: string;
  cancelReason?: string;

  // Financial summaries (auto-calculated)
  totalPrice?: number; // Sum of all item priceAfterBargain
  totalBookingAmount?: number; // Sum of all bookingAmount
  totalAdvance?: number; // Sum of all advance payments
  totalFinalPayment?: number; // Sum of all finalPayment
  totalPaid?: number; // Sum of all totalPaid
  totalPending?: number; // Sum of all pending amounts
  totalSecurity?: number; // Sum of all securityAmount

  // Cost tracking
  totalTransportCost?: number; // Sum of all transportCost
  totalDryCleaningCost?: number; // Sum of all dryCleaningCost
  totalRepairCost?: number; // Sum of all repairCost
  totalOperationalCost?: number; // transportCost + dryCleaningCost + repairCost

  // Profit/Loss calculation
  grossProfit?: number; // totalPaid - totalPrice
  netProfit?: number; // grossProfit - totalOperationalCost

  // Workflow milestones
  workflowStage?: 'booking' | 'payment' | 'delivery' | 'usage' | 'return' | 'processing' | 'completed';

  // Notes and comments
  adminNotes?: string;
  customerNotes?: string;

  createdAt: string;
  updatedAt: string;
}