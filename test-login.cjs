// Test Admin Login - Exact replica of frontend request
const axios = require('axios');

const API_BASE_URL = 'https://rent-moment-hfdbfea8abcmcwh4.centralindia-01.azurewebsites.net/api';

class TestApiService {
  constructor() {
    this.baseURL = API_BASE_URL;

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🚀 Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
        console.log('📤 Request data:', config.data);
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ Response received:', response.status, response.statusText);
        return response;
      },
      (error) => {
        console.error('❌ Response error:', error.response?.status, error.response?.statusText);
        console.error('❌ Error data:', error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  async login(credentials) {
    try {
      console.log('\n🔐 Attempting login...');
      const response = await this.api.post('/auth/login', credentials);
      console.log('🎉 Login successful!');
      return response.data.data;
    } catch (error) {
      console.error('💥 Login failed:', error.message);
      throw error;
    }
  }
}

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login from Frontend Perspective...\n');

  const apiService = new TestApiService();

  try {
    const result = await apiService.login({
      email: 'admin@clothingrental.com',
      password: 'admin123456'
    });

    console.log('\n✅ LOGIN SUCCESSFUL!');
    console.log('👤 User:', result.user.name);
    console.log('📧 Email:', result.user.email);
    console.log('🔑 Role:', result.user.role);
    console.log('🎫 Token received:', result.token ? 'YES' : 'NO');

  } catch (error) {
    console.error('\n❌ LOGIN FAILED!');
    console.error('Error details:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAdminLogin();