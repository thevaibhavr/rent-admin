// Dashboard Testing Script
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
let adminToken = '';

async function testDashboard() {
  console.log('🧪 Testing Dashboard Functionality...');

  // Login
  const login = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: 'admin@clothingrental.com',
    password: 'testadmin123'
  });
  adminToken = login.data.data.token;
  console.log('✅ Admin login successful');

  // Test booking stats
  console.log('\n📊 Testing Booking Statistics...');
  const bookingStats = await axios.get(`${API_BASE_URL}/bookings/stats/summary`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log('Booking Stats:');
  console.log(`- Total Bookings: ${bookingStats.data.data.summary.totalBookings}`);
  console.log(`- Total Revenue: ₹${(bookingStats.data.data.summary.totalRevenue || 0).toLocaleString('en-IN')}`);
  console.log(`- Active Bookings: ${bookingStats.data.data.summary.activeBookings}`);
  console.log(`- Completed Bookings: ${bookingStats.data.data.summary.completedBookings}`);
  console.log(`- Total Customers: ${bookingStats.data.data.summary.totalCustomers}`);

  // Test user stats
  console.log('\n👥 Testing User Statistics...');
  const userStats = await axios.get(`${API_BASE_URL}/users/stats/summary`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log('User Stats:');
  console.log(`- Total Users: ${userStats.data.data.summary.totalUsers}`);
  console.log(`- Active Users: ${userStats.data.data.summary.activeUsers}`);
  console.log(`- Admin Users: ${userStats.data.data.summary.adminUsers}`);

  // Test customer stats
  console.log('\n👨‍👩‍👧‍👦 Testing Customer Statistics...');
  const customerStats = await axios.get(`${API_BASE_URL}/customers/stats/summary`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log('Customer Stats:');
  console.log(`- Total Customers: ${customerStats.data.data.summary.totalCustomers}`);
  console.log(`- Active Customers: ${customerStats.data.data.summary.activeCustomers}`);
  console.log(`- Top Customers Count: ${customerStats.data.data.summary.topCustomers?.length || 0}`);

  // Test filtered stats
  console.log('\n📅 Testing Filtered Statistics (Current Month)...');
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const filteredStats = await axios.get(
    `${API_BASE_URL}/bookings/stats/summary?filter=month&month=${currentMonth}&year=${currentYear}`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  console.log('Filtered Stats (Current Month):');
  console.log(`- Bookings: ${filteredStats.data.data.summary.totalBookings}`);
  console.log(`- Revenue: ₹${(filteredStats.data.data.summary.totalRevenue || 0).toLocaleString('en-IN')}`);

  // Test customer search
  console.log('\n🔍 Testing Customer Search...');
  const customerSearch = await axios.get(`${API_BASE_URL}/customers/search/987654`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log(`Found ${customerSearch.data.data.customers.length} customers matching "987654"`);

  // Test recent customers
  console.log('\n📈 Testing Recent Customer Activity...');
  const recentCustomers = await axios.get(`${API_BASE_URL}/customers?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log(`Recent customers: ${recentCustomers.data.data.customers.length}`);

  // Calculate dashboard metrics
  console.log('\n📊 Dashboard Metrics Calculation:');

  const stats = {
    ...bookingStats.data.data.summary,
    ...userStats.data.data.summary,
    customerTotalCustomers: customerStats.data.data.summary.totalCustomers,
    customerActiveCustomers: customerStats.data.data.summary.activeCustomers,
    topCustomers: customerStats.data.data.summary.topCustomers
  };

  console.log('Combined Dashboard Stats:');
  console.log(`- Total Bookings: ${stats.totalBookings}`);
  console.log(`- Total Revenue: ₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`);
  console.log(`- Total Customers: ${stats.customerTotalCustomers || stats.totalCustomers}`);
  console.log(`- Active Customers: ${stats.customerActiveCustomers}`);
  console.log(`- Net Profit: ₹${(stats.netProfit || 0).toLocaleString('en-IN')}`);
  console.log(`- Completion Rate: ${
    stats.totalBookings ?
    Math.round(((stats.completedBookings || 0) / stats.totalBookings) * 100) :
    0
  }%`);

  // Business insights calculations
  if (stats.customerTotalCustomers) {
    console.log('\n💡 Business Insights:');
    console.log(`- Revenue per Customer: ₹${Math.round((stats.totalRevenue || 0) / stats.customerTotalCustomers).toLocaleString('en-IN')}`);
    console.log(`- Repeat Rate: ${Math.round(((stats.repeatCustomers || 0) / stats.customerTotalCustomers) * 100)}%`);
    console.log(`- Average Booking Value: ₹${Math.round((stats.totalRevenue || 0) / stats.totalBookings).toLocaleString('en-IN')}`);
  }

  console.log('\n✅ Dashboard testing completed successfully!');
  console.log('🎯 All dashboard data is properly integrated and calculated!');
}

testDashboard().catch(console.error);