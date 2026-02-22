// Test Customer Functionality
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
let adminToken = '';

async function testCustomerFunctionality() {
  console.log('🧪 Testing Customer Functionality...');

  // Login
  const login = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: 'admin@clothingrental.com',
    password: 'testadmin123'
  });
  adminToken = login.data.data.token;
  console.log('✅ Admin login successful');

  // Create test customers
  const testCustomers = [
    {
      name: 'John Doe',
      mobile: '9876543210',
      email: 'john@example.com',
      location: 'Mumbai, Maharashtra',
      measurements: {
        bust: 34,
        waist: 28,
        hips: 36,
        size: 'M'
      }
    },
    {
      name: 'Jane Smith',
      mobile: '9876543211',
      email: 'jane@example.com',
      location: 'Delhi, India',
      measurements: {
        bust: 32,
        waist: 26,
        hips: 34,
        size: 'S'
      }
    }
  ];

  const createdCustomers = [];
  for (const customer of testCustomers) {
    try {
      const response = await axios.post(`${API_BASE_URL}/customers`, customer, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      createdCustomers.push(response.data.data.customer);
      console.log(`✅ Created customer: ${customer.name}`);
    } catch (error) {
      console.error(`❌ Failed to create customer ${customer.name}:`, error.message);
    }
  }

  // Test customer search
  console.log('\n🔍 Testing customer search...');
  try {
    const searchResponse = await axios.get(`${API_BASE_URL}/customers/search/987654321`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Found ${searchResponse.data.data.customers.length} customers for search "987654321"`);
  } catch (error) {
    console.error('❌ Customer search failed:', error.message);
  }

  // Test booking with customer save
  console.log('\n📝 Testing booking with customer save...');
  const bookingData = {
    items: [{
      dressId: 'test1',
      priceAfterBargain: 2000,
      bookingAmount: 500,
      advance: 800,
      pending: 700,
      finalPayment: 0,
      totalPaid: 1300,
      transportCost: 100,
      dryCleaningCost: 150,
      additionalCosts: [{ reason: 'Extra service', amount: 50 }],
      status: 'booked'
    }],
    customer: {
      name: 'Test Customer',
      mobile: '9999999999', // New customer
      email: 'test@example.com'
    }
  };

  try {
    const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, bookingData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Booking created, customer should be saved');

    // Check if customer was created
    const customerCheck = await axios.get(`${API_BASE_URL}/customers/search/9999999999`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (customerCheck.data.data.customers.length > 0) {
      console.log('✅ Customer was automatically saved from booking');
    } else {
      console.log('❌ Customer was not saved from booking');
    }

    // Clean up booking
    const bookingId = bookingResponse.data.data.booking._id;
    await axios.delete(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

  } catch (error) {
    console.error('❌ Booking with customer save failed:', error.message);
  }

  // Clean up test customers
  console.log('\n🧹 Cleaning up test customers...');
  for (const customer of createdCustomers) {
    try {
      await axios.delete(`${API_BASE_URL}/customers/${customer._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ Deleted customer: ${customer.name}`);
    } catch (error) {
      console.error(`❌ Failed to delete customer ${customer.name}:`, error.message);
    }
  }

  console.log('🎉 Customer functionality test completed!');
}

testCustomerFunctionality().catch(console.error);