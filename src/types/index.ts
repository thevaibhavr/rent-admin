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
}

export interface BookingItem {
  dressId: string | Product;
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
  referenceCustomer?: string;
  // Status fields
  status?: 'active' | 'completed' | 'canceled';
  canceledAt?: string;
  cancelReason?: string;
  // Auto-calculated totals
  totalPrice?: number;
  totalAdvance?: number;
  totalPending?: number;
  totalSecurity?: number;
  totalPaid?: number; // Total amount paid for completed bookings
  createdAt: string;
  updatedAt: string;
}