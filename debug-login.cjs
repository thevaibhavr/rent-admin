// Debug Admin Login - Detailed error analysis
const axios = require('axios');

const API_BASE_URL = 'https://rent-moment-hfdbfea8abcmcwh4.centralindia-01.azurewebsites.net/api';

async function debugAdminLogin() {
  console.log('🔍 Debugging Admin Login Issues...\n');

  // Test 1: Basic connectivity
  console.log('1️⃣ Testing basic connectivity...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ API is accessible');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ API server is not responding');
      return;
    }
    // Health endpoint might not exist, that's ok
    console.log('⚠️  Health check failed, but continuing...');
  }

  // Test 2: CORS preflight
  console.log('\n2️⃣ Testing CORS preflight...');
  try {
    const preflightResponse = await axios.options(`${API_BASE_URL}/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    console.log('✅ CORS preflight successful');
  } catch (error) {
    console.log('❌ CORS preflight failed:', error.message);
  }

  // Test 3: Login with detailed logging
  console.log('\n3️⃣ Testing login request...');
  try {
    console.log('Making POST request to:', `${API_BASE_URL}/auth/login`);
    console.log('Request data:', {
      email: 'admin@clothingrental.com',
      password: 'admin123456'
    });

    const startTime = Date.now();
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@clothingrental.com',
      password: 'admin123456'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      timeout: 10000
    });

    const endTime = Date.now();
    console.log(`✅ Login successful in ${endTime - startTime}ms`);
    console.log('Response status:', response.status);
    console.log('Response headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials']
    });
    console.log('User role:', response.data.data.user.role);

  } catch (error) {
    console.log('\n❌ Login failed with error:');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);

    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('No response received. Request details:');
      console.log('- Timeout or network error');
      console.log('- Check if API server is running');
      console.log('- Check network connectivity');
    } else {
      console.log('Request setup error:', error.message);
    }

    if (error.code) {
      console.log('Error code:', error.code);
    }
  }

  // Test 4: Check if it's a browser-specific issue
  console.log('\n4️⃣ Testing with different User-Agent...');
  try {
    const browserResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@clothingrental.com',
      password: 'admin123456'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    console.log('✅ Browser simulation successful');
  } catch (error) {
    console.log('❌ Browser simulation failed:', error.message);
  }
}

debugAdminLogin();