import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Category,
  Product,
  Order,
  DashboardStats,
  LoginCredentials,
  AuthResponse,
  CreateCategoryData,
  CreateProductData,
  CreateMerchantData,
  Merchant,
  UpdateOrderStatusData,
  Booking,
  Customer
} from '@/types';

// Beauty-related interfaces
interface Supercategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BeautyCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  supercategory: string | Supercategory;
  isActive: boolean;
  sortOrder: number;
  products: number;
  createdAt: string;
  updatedAt: string;
}

interface RoutineCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface WinterCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SummerCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ClothCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface WomanCareCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface KidsCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PerfumeCategory {
  _id: string;
  name: string;
  description?: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BeautyProductData {
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

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://rent-moment-hfdbfea8abcmcwh4.centralindia-01.azurewebsites.net/api';
    

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token  
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
          // For special admin tokens, still send them but backend will handle them
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/login', credentials);
    return response.data.data!;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.get('/auth/me');
    return response.data.data!.user;
  }

  // Categories endpoints
  async getCategories(page = 1, limit = 10): Promise<PaginatedResponse<Category>> {
    const response: AxiosResponse<PaginatedResponse<Category>> = await this.api.get(`/categories?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getCategory(id: string): Promise<Category> {
    const response: AxiosResponse<ApiResponse<{ category: Category }>> = await this.api.get(`/categories/${id}`);
    return response.data.data!.category;
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    const response: AxiosResponse<ApiResponse<{ category: Category }>> = await this.api.post('/categories', data);
    return response.data.data!.category;
  }

  async updateCategory(id: string, data: Partial<CreateCategoryData>): Promise<Category> {
    const response: AxiosResponse<ApiResponse<{ category: Category }>> = await this.api.put(`/categories/${id}`, data);
    return response.data.data!.category;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // Merchants endpoints
  async getMerchants(page = 1, limit = 10, filters?: Record<string, string>): Promise<PaginatedResponse<Merchant>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response: AxiosResponse<PaginatedResponse<Merchant>> = await this.api.get(`/merchants?${params}`);
    return response.data;
  }

  async getMerchant(id: string): Promise<Merchant> {
    const response: AxiosResponse<ApiResponse<{ merchant: Merchant }>> = await this.api.get(`/merchants/${id}`);
    return response.data.data!.merchant;
  }

  async createMerchant(data: CreateMerchantData): Promise<Merchant> {
    const response: AxiosResponse<ApiResponse<{ merchant: Merchant }>> = await this.api.post('/merchants', data);
    return response.data.data!.merchant;
  }

  async updateMerchant(id: string, data: Partial<CreateMerchantData>): Promise<Merchant> {
    const response: AxiosResponse<ApiResponse<{ merchant: Merchant }>> = await this.api.put(`/merchants/${id}`, data);
    return response.data.data!.merchant;
  }

  async deleteMerchant(id: string): Promise<void> {
    await this.api.delete(`/merchants/${id}`);
  }

  // Products endpoints
  async getProducts(page = 1, limit = 12, filters?: Record<string, string>): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response: AxiosResponse<PaginatedResponse<Product>> = await this.api.get(`/products?${params}`);
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response: AxiosResponse<ApiResponse<{ product: Product }>> = await this.api.get(`/products/${id}`);
    return response.data.data!.product;
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    const response: AxiosResponse<ApiResponse<{ product: Product }>> = await this.api.post('/products', data);
    return response.data.data!.product;
  }

  async createBeautyProduct(data: BeautyProductData): Promise<Product> {
    const response: AxiosResponse<ApiResponse<{ product: Product }>> = await this.api.post('/beauty-products', data);
    return response.data.data!.product;
  }

  async updateProduct(id: string, data: Partial<CreateProductData>): Promise<Product> {
    const response: AxiosResponse<ApiResponse<{ product: Product }>> = await this.api.put(`/products/${id}`, data);
    return response.data.data!.product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.api.delete(`/products/${id}`);
  }

  // Orders endpoints
  async getOrders(page = 1, limit = 10, filters?: Record<string, string>): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response: AxiosResponse<PaginatedResponse<Order>> = await this.api.get(`/orders?${params}`);
    return response.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response: AxiosResponse<ApiResponse<{ order: Order }>> = await this.api.get(`/orders/${id}`);
    return response.data.data!.order;
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusData): Promise<Order> {
    const response: AxiosResponse<ApiResponse<{ order: Order }>> = await this.api.put(`/orders/${id}/status`, data);
    return response.data.data!.order;
  }

  async cancelOrder(id: string, adminNotes?: string): Promise<Order> {
    const response: AxiosResponse<ApiResponse<{ order: Order }>> = await this.api.put(`/orders/${id}/cancel`, { adminNotes });
    return response.data.data!.order;
  }

  async getOrderStats(): Promise<DashboardStats> {
    const response: AxiosResponse<ApiResponse<{ summary: DashboardStats }>> = await this.api.get('/orders/stats/summary');
    return response.data.data!.summary;
  }

  // Users endpoints
  async getUsers(page = 1, limit = 10, filters?: Record<string, string>): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get(`/users?${params}`);
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.get(`/users/${id}`);
    return response.data.data!.user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.put(`/users/${id}`, data);
    return response.data.data!.user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  async toggleUserStatus(id: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.put(`/users/${id}/toggle-status`);
    return response.data.data!.user;
  }

  async getUserStats(): Promise<DashboardStats> {
    const response: AxiosResponse<ApiResponse<{ summary: DashboardStats }>> = await this.api.get('/users/stats/summary');
    return response.data.data!.summary;
  }

  // Highlight products endpoints
  async getHighlightedProducts(): Promise<{ products: Product[] }> {
    const response: AxiosResponse<ApiResponse<{ products: Product[] }>> = await this.api.get('/products/highlighted');
    return response.data.data!;
  }

  async highlightProduct(productId: string): Promise<Product> {
    const response: AxiosResponse<ApiResponse<{ product: Product }>> = await this.api.post(`/products/highlight/${productId}`);
    return response.data.data!.product;
  }

  async unhighlightProduct(productId: string): Promise<void> {
    await this.api.delete(`/products/highlight/${productId}`);
  }

  async updateHighlightOrder(products: Array<{ id: string; order: number }>): Promise<void> {
    await this.api.put('/products/highlight/order', { products });
  }

  // Bookings endpoints
  async getBookings(): Promise<{ bookings: Booking[] }> {
    const response = await this.api.get<ApiResponse<{ bookings: Booking[] }>>('/bookings');
    return response.data.data!;
  }

  async getBooking(id: string): Promise<Booking> {
    const response = await this.api.get<ApiResponse<{ booking: Booking }>>(`/bookings/${id}`);
    return response.data.data!.booking;
  }

  async createBooking(data: Partial<Booking>): Promise<Booking> {
    const response = await this.api.post<ApiResponse<{ booking: Booking }>>('/bookings', data);
    return response.data.data!.booking;
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
    const response = await this.api.put<ApiResponse<{ booking: Booking }>>(`/bookings/${id}`, data);
    return response.data.data!.booking;
  }

  async deleteBooking(id: string): Promise<void> {
    await this.api.delete(`/bookings/${id}`);
  }

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const response = await this.api.put<ApiResponse<{ booking: Booking }>>(`/bookings/${id}/cancel`, { reason });
    return response.data.data!.booking;
  }

  async getBookingStats(filters?: { filter?: string; week?: string; month?: number; year?: number }): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (filters?.filter) {
      params.append('filter', filters.filter);
      if (filters.filter === 'week' && filters.week) {
        params.append('week', filters.week);
      } else if (filters.filter === 'month' && filters.month !== undefined && filters.year) {
        params.append('month', filters.month.toString());
        params.append('year', filters.year.toString());
      } else if (filters.filter === 'year' && filters.year) {
        params.append('year', filters.year.toString());
      }
    }
    const queryString = params.toString();
    const url = `/bookings/stats/summary${queryString ? `?${queryString}` : ''}`;
    const response: AxiosResponse<ApiResponse<{ summary: DashboardStats }>> = await this.api.get(url);
    return response.data.data!.summary;
  }

  // Customers endpoints
  async getCustomers(page = 1, limit = 10, search?: string): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (search) {
      params.append('search', search);
    }
    const response: AxiosResponse<PaginatedResponse<Customer>> = await this.api.get(`/customers?${params}`);
    return response.data;
  }

  async getCustomer(id: string): Promise<Customer> {
    const response: AxiosResponse<ApiResponse<{ customer: Customer }>> = await this.api.get(`/customers/${id}`);
    return response.data.data!.customer;
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response: AxiosResponse<ApiResponse<{ customer: Customer }>> = await this.api.post('/customers', data);
    return response.data.data!.customer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const response: AxiosResponse<ApiResponse<{ customer: Customer }>> = await this.api.put(`/customers/${id}`, data);
    return response.data.data!.customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.api.delete(`/customers/${id}`);
  }

  async searchCustomers(mobile: string): Promise<{ customers: Customer[] }> {
    const response: AxiosResponse<ApiResponse<{ customers: Customer[] }>> = await this.api.get(`/customers/search/${mobile}`);
    return response.data.data!;
  }

  async getCustomerStats(): Promise<{ totalCustomers: number; activeCustomers: number; topCustomers: Customer[] }> {
    const response: AxiosResponse<ApiResponse<{ summary: { totalCustomers: number; activeCustomers: number; topCustomers: Customer[] } }>> = await this.api.get('/customers/stats/summary');
    return response.data.data!.summary;
  }

  // Supercategories endpoints
  async getSupercategories(): Promise<{ supercategories: Supercategory[] }> {
    const response: AxiosResponse<ApiResponse<{ supercategories: Supercategory[] }>> = await this.api.get('/supercategories/all');
    return response.data.data!;
  }

  async getSupercategory(id: string): Promise<Supercategory> {
    const response: AxiosResponse<ApiResponse<{ supercategory: Supercategory }>> = await this.api.get(`/supercategories/${id}`);
    return response.data.data!.supercategory;
  }

  async createSupercategory(data: { name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }): Promise<Supercategory> {
    const response: AxiosResponse<ApiResponse<{ supercategory: Supercategory }>> = await this.api.post('/supercategories', data);
    return response.data.data!.supercategory;
  }

  async updateSupercategory(id: string, data: Partial<{ name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }>): Promise<Supercategory> {
    const response: AxiosResponse<ApiResponse<{ supercategory: Supercategory }>> = await this.api.put(`/supercategories/${id}`, data);
    return response.data.data!.supercategory;
  }

  async deleteSupercategory(id: string): Promise<void> {
    await this.api.delete(`/supercategories/${id}`);
  }

  // Beauty Categories endpoints
  async getBeautyCategories(supercategory?: string): Promise<{ categories: BeautyCategory[] }> {
    const url = supercategory ? `/beauty-categories/all?supercategory=${supercategory}` : '/beauty-categories/all';
    const response: AxiosResponse<ApiResponse<{ categories: BeautyCategory[] }>> = await this.api.get(url);
    return response.data.data!;
  }

  async getBeautyCategory(id: string): Promise<BeautyCategory> {
    const response: AxiosResponse<ApiResponse<{ category: BeautyCategory }>> = await this.api.get(`/beauty-categories/${id}`);
    return response.data.data!.category;
  }

  async createBeautyCategory(data: { name: string; description?: string; image: string; supercategory: string; sortOrder?: number; products?: number; isActive?: boolean }): Promise<BeautyCategory> {
    const response: AxiosResponse<ApiResponse<{ category: BeautyCategory }>> = await this.api.post('/beauty-categories', data);
    return response.data.data!.category;
  }

  async updateBeautyCategory(id: string, data: Partial<{ name: string; description?: string; image: string; supercategory: string; sortOrder?: number; isActive?: boolean; products?: number }>): Promise<BeautyCategory> {
    const response: AxiosResponse<ApiResponse<{ category: BeautyCategory }>> = await this.api.put(`/beauty-categories/${id}`, data);
    return response.data.data!.category;
  }

  async deleteBeautyCategory(id: string): Promise<void> {
    await this.api.delete(`/beauty-categories/${id}`);
  }

  // Routine Categories endpoints
  async getRoutineCategories(): Promise<{ categories: RoutineCategory[] }> {
    const response: AxiosResponse<ApiResponse<{ categories: RoutineCategory[] }>> = await this.api.get('/routine-categories/all');
    return response.data.data!;
  }

  async getRoutineCategory(id: string): Promise<RoutineCategory> {
    const response: AxiosResponse<ApiResponse<{ category: RoutineCategory }>> = await this.api.get(`/routine-categories/${id}`);
    return response.data.data!.category;
  }

  async createRoutineCategory(data: { name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }): Promise<RoutineCategory> {
    const response: AxiosResponse<ApiResponse<{ category: RoutineCategory }>> = await this.api.post('/routine-categories', data);
    return response.data.data!.category;
  }

  async updateRoutineCategory(id: string, data: Partial<{ name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }>): Promise<RoutineCategory> {
    const response: AxiosResponse<ApiResponse<{ category: RoutineCategory }>> = await this.api.put(`/routine-categories/${id}`, data);
    return response.data.data!.category;
  }

  async deleteRoutineCategory(id: string): Promise<void> {
    await this.api.delete(`/routine-categories/${id}`);
  }

  // Winter Categories endpoints
  async getWinterCategories(): Promise<{ categories: WinterCategory[] }> {
    const response: AxiosResponse<ApiResponse<{ categories: WinterCategory[] }>> = await this.api.get('/winter-categories/all');
    return response.data.data!;
  }

  async getWinterCategory(id: string): Promise<WinterCategory> {
    const response: AxiosResponse<ApiResponse<{ category: WinterCategory }>> = await this.api.get(`/winter-categories/${id}`);
    return response.data.data!.category;
  }

  async createWinterCategory(data: { name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }): Promise<WinterCategory> {
    const response: AxiosResponse<ApiResponse<{ category: WinterCategory }>> = await this.api.post('/winter-categories', data);
    return response.data.data!.category;
  }

  async updateWinterCategory(id: string, data: Partial<{ name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }>): Promise<WinterCategory> {
    const response: AxiosResponse<ApiResponse<{ category: WinterCategory }>> = await this.api.put(`/winter-categories/${id}`, data);
    return response.data.data!.category;
  }

  async deleteWinterCategory(id: string): Promise<void> {
    await this.api.delete(`/winter-categories/${id}`);
  }

  // Summer Categories endpoints
  async getSummerCategories(): Promise<{ categories: SummerCategory[] }> {
    const response: AxiosResponse<ApiResponse<{ categories: SummerCategory[] }>> = await this.api.get('/summer-categories/all');
    return response.data.data!;
  }

  async getSummerCategory(id: string): Promise<SummerCategory> {
    const response: AxiosResponse<ApiResponse<{ category: SummerCategory }>> = await this.api.get(`/summer-categories/${id}`);
    return response.data.data!.category;
  }

  async createSummerCategory(data: { name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }): Promise<SummerCategory> {
    const response: AxiosResponse<ApiResponse<{ category: SummerCategory }>> = await this.api.post('/summer-categories', data);
    return response.data.data!.category;
  }

  async updateSummerCategory(id: string, data: Partial<{ name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }>): Promise<SummerCategory> {
    const response: AxiosResponse<ApiResponse<{ category: SummerCategory }>> = await this.api.put(`/summer-categories/${id}`, data);
    return response.data.data!.category;
  }

  async deleteSummerCategory(id: string): Promise<void> {
    await this.api.delete(`/summer-categories/${id}`);
  }

  // Cloth Categories endpoints
  async getClothCategories(): Promise<{ categories: ClothCategory[] }> {
    const response: AxiosResponse<ApiResponse<{ categories: ClothCategory[] }>> = await this.api.get('/cloth-categories/all');
    return response.data.data!;
  }

  async getClothCategory(id: string): Promise<ClothCategory> {
    const response: AxiosResponse<ApiResponse<{ category: ClothCategory }>> = await this.api.get(`/cloth-categories/${id}`);
    return response.data.data!.category;
  }

  async createClothCategory(data: { name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }): Promise<ClothCategory> {
    const response: AxiosResponse<ApiResponse<{ category: ClothCategory }>> = await this.api.post('/cloth-categories', data);
    return response.data.data!.category;
  }

  async updateClothCategory(id: string, data: Partial<{ name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }>): Promise<ClothCategory> {
    const response: AxiosResponse<ApiResponse<{ category: ClothCategory }>> = await this.api.put(`/cloth-categories/${id}`, data);
    return response.data.data!.category;
  }

  async deleteClothCategory(id: string): Promise<void> {
    await this.api.delete(`/cloth-categories/${id}`);
  }

  // Woman Care Categories endpoints
  async getWomanCareCategories(): Promise<{ categories: WomanCareCategory[] }> {
    const response: AxiosResponse<ApiResponse<{ categories: WomanCareCategory[] }>> = await this.api.get('/woman-care-categories/all');
    return response.data.data!;
  }

  async getWomanCareCategory(id: string): Promise<WomanCareCategory> {
    const response: AxiosResponse<ApiResponse<{ category: WomanCareCategory }>> = await this.api.get(`/woman-care-categories/${id}`);
    return response.data.data!.category;
  }

  async createWomanCareCategory(data: { name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }): Promise<WomanCareCategory> {
    const response: AxiosResponse<ApiResponse<{ category: WomanCareCategory }>> = await this.api.post('/woman-care-categories', data);
    return response.data.data!.category;
  }

  async updateWomanCareCategory(id: string, data: Partial<{ name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }>): Promise<WomanCareCategory> {
    const response: AxiosResponse<ApiResponse<{ category: WomanCareCategory }>> = await this.api.put(`/woman-care-categories/${id}`, data);
    return response.data.data!.category;
  }

  async deleteWomanCareCategory(id: string): Promise<void> {
    await this.api.delete(`/woman-care-categories/${id}`);
  }

  // Kids Categories endpoints
  async getKidsCategories(): Promise<{ categories: KidsCategory[] }> {
    const response: AxiosResponse<ApiResponse<{ categories: KidsCategory[] }>> = await this.api.get('/kids-categories/all');
    return response.data.data!;
  }

  async getKidsCategory(id: string): Promise<KidsCategory> {
    const response: AxiosResponse<ApiResponse<{ category: KidsCategory }>> = await this.api.get(`/kids-categories/${id}`);
    return response.data.data!.category;
  }

  async createKidsCategory(data: { name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }): Promise<KidsCategory> {
    const response: AxiosResponse<ApiResponse<{ category: KidsCategory }>> = await this.api.post('/kids-categories', data);
    return response.data.data!.category;
  }

  async updateKidsCategory(id: string, data: Partial<{ name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }>): Promise<KidsCategory> {
    const response: AxiosResponse<ApiResponse<{ category: KidsCategory }>> = await this.api.put(`/kids-categories/${id}`, data);
    return response.data.data!.category;
  }

  async deleteKidsCategory(id: string): Promise<void> {
    await this.api.delete(`/kids-categories/${id}`);
  }

  // Perfume Categories endpoints
  async getPerfumeCategories(): Promise<{ categories: PerfumeCategory[] }> {
    const response: AxiosResponse<ApiResponse<{ categories: PerfumeCategory[] }>> = await this.api.get('/perfume-categories/all');
    return response.data.data!;
  }

  async getPerfumeCategory(id: string): Promise<PerfumeCategory> {
    const response: AxiosResponse<ApiResponse<{ category: PerfumeCategory }>> = await this.api.get(`/perfume-categories/${id}`);
    return response.data.data!.category;
  }

  async createPerfumeCategory(data: { name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }): Promise<PerfumeCategory> {
    const response: AxiosResponse<ApiResponse<{ category: PerfumeCategory }>> = await this.api.post('/perfume-categories', data);
    return response.data.data!.category;
  }

  async updatePerfumeCategory(id: string, data: Partial<{ name: string; description?: string; image: string; sortOrder?: number; isActive?: boolean }>): Promise<PerfumeCategory> {
    const response: AxiosResponse<ApiResponse<{ category: PerfumeCategory }>> = await this.api.put(`/perfume-categories/${id}`, data);
    return response.data.data!.category;
  }

  async deletePerfumeCategory(id: string): Promise<void> {
    await this.api.delete(`/perfume-categories/${id}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response: AxiosResponse<{ status: string; message: string }> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService(); 