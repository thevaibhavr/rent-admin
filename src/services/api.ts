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
  UpdateOrderStatusData
} from '@/types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    this.baseURL = 'https://cloth-backend-tpce.onrender.com/api';
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

  // Products endpoints
  async getProducts(page = 1, limit = 12, filters?: Record<string, any>): Promise<PaginatedResponse<Product>> {
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

  async updateProduct(id: string, data: Partial<CreateProductData>): Promise<Product> {
    const response: AxiosResponse<ApiResponse<{ product: Product }>> = await this.api.put(`/products/${id}`, data);
    return response.data.data!.product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.api.delete(`/products/${id}`);
  }

  // Orders endpoints
  async getOrders(page = 1, limit = 10, filters?: Record<string, any>): Promise<PaginatedResponse<Order>> {
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
  async getUsers(page = 1, limit = 10, filters?: Record<string, any>): Promise<PaginatedResponse<User>> {
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

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response: AxiosResponse<{ status: string; message: string }> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService(); 