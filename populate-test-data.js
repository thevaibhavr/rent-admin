// Populate Test Data for Dashboard
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
let adminToken = '';

async function populateTestData() {
  console.log('📝 Populating test data for dashboard...');

  // Login
  const login = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: 'admin@clothingrental.com',
    password: 'testadmin123'
  });
  adminToken = login.data.data.token;
  console.log('✅ Admin login successful');

  // Create test category first
  const category = await axios.post(`${API_BASE_URL}/categories`, {
    name: 'Test Collection',
    description: 'Test category for dashboard data',
    image: 'https://via.placeholder.com/300x300?text=Test',
    sortOrder: 1
  }, { headers: { Authorization: `Bearer ${adminToken}` } });

  console.log('✅ Test category created');

  // Create test products
  const products = [];
  const productNames = [
    'Designer Lehenga', 'Bridal Saree', 'Party Gown', 'Cocktail Dress',
    'Traditional Sherwani', 'Wedding Suit', 'Reception Dress', 'Mehendi Outfit'
  ];

  for (let i = 0; i < 8; i++) {
    const product = await axios.post(`${API_BASE_URL}/products`, {
      name: productNames[i],
      description: `Beautiful ${productNames[i].toLowerCase()} for special occasions`,
      categories: [category.data.data.category._id],
      images: [`https://via.placeholder.com/400x500?text=${productNames[i].replace(' ', '+')}`],
      price: 4000 + (i * 500), // Prices from ₹4,000 to ₹8,000
      originalPrice: 4500 + (i * 500),
      brand: 'Test Brand',
      color: ['Red', 'Blue', 'Gold', 'White', 'Pink', 'Black', 'Green', 'Purple'][i],
      material: 'Premium fabric',
      condition: 'Excellent',
      sizes: [{ size: 'M', isAvailable: true, quantity: 5 }],
      isFeatured: i < 3,
      isActive: true
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    products.push(product.data.data.product);
    console.log(`✅ Created product: ${productNames[i]}`);
  }

  // Create test customers
  const customers = [];
  const customerData = [
    { name: 'Priya Sharma', mobile: '9876543210', email: 'priya@example.com', location: 'Mumbai' },
    { name: 'Rahul Verma', mobile: '9876543211', email: 'rahul@example.com', location: 'Delhi' },
    { name: 'Anjali Patel', mobile: '9876543212', email: 'anjali@example.com', location: 'Ahmedabad' },
    { name: 'Vikram Singh', mobile: '9876543213', email: 'vikram@example.com', location: 'Jaipur' },
    { name: 'Sneha Reddy', mobile: '9876543214', email: 'sneha@example.com', location: 'Hyderabad' },
    { name: 'Arjun Kumar', mobile: '9876543215', email: 'arjun@example.com', location: 'Bangalore' }
  ];

  for (const cust of customerData) {
    const customer = await axios.post(`${API_BASE_URL}/customers`, {
      ...cust,
      measurements: {
        bust: 32 + Math.floor(Math.random() * 8),
        waist: 26 + Math.floor(Math.random() * 6),
        hips: 34 + Math.floor(Math.random() * 8),
        size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)]
      }
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    customers.push(customer.data.data.customer);
    console.log(`✅ Created customer: ${cust.name}`);
  }

  // Create test bookings with different statuses
  const bookings = [];
  const statuses = ['active', 'completed', 'completed', 'completed', 'active', 'completed'];

  for (let i = 0; i < 12; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const priceAfterBargain = product.price - Math.floor(Math.random() * 500);
    const bookingAmount = Math.floor(priceAfterBargain * 0.2);
    const advance = Math.floor(priceAfterBargain * 0.5);
    const finalPayment = status === 'completed' ? (priceAfterBargain - advance) : 0;
    const totalPaid = bookingAmount + advance + finalPayment;

    const booking = await axios.post(`${API_BASE_URL}/bookings`, {
      items: [{
        dressId: product._id,
        originalPrice: product.price,
        priceAfterBargain: priceAfterBargain,
        discount: product.price - priceAfterBargain,
        bookingAmount: bookingAmount,
        advance: advance,
        pending: priceAfterBargain - totalPaid,
        finalPayment: finalPayment,
        totalPaid: totalPaid,
        securityAmount: Math.floor(priceAfterBargain * 0.1),
        additionalCosts: Math.random() > 0.7 ? [{
          reason: 'Alteration',
          amount: Math.floor(Math.random() * 300) + 100
        }] : [],
        bookingDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        transportCost: Math.floor(Math.random() * 200) + 50,
        dryCleaningCost: Math.floor(Math.random() * 300) + 100,
        repairCost: 0,
        status: status === 'completed' ? 'returned' : 'booked'
      }],
      customer: {
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        location: customer.location
      },
      deliveryAddress: `${customer.location}, India - ${400001 + Math.floor(Math.random() * 1000)}`,
      rentalDuration: 2 + Math.floor(Math.random() * 4),
      returnDeadline: new Date(Date.now() + (7 + Math.floor(Math.random() * 14)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMethod: 'online',
      specialInstructions: 'Handle with care',
      referenceCustomer: Math.random() > 0.8 ? 'Previous Customer' : '',
      status: status
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    bookings.push(booking.data.data.booking);
    console.log(`✅ Created booking for ${customer.name} - ${status}`);
  }

  console.log('\n📊 Test Data Summary:');
  console.log(`- Categories: 1`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Customers: ${customers.length}`);
  console.log(`- Bookings: ${bookings.length}`);

  // Get final stats
  const finalStats = await axios.get(`${API_BASE_URL}/bookings/stats/summary`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log('\n🎯 Final Dashboard Stats:');
  console.log(`- Total Bookings: ${finalStats.data.data.summary.totalBookings}`);
  console.log(`- Total Revenue: ₹${(finalStats.data.data.summary.totalRevenue || 0).toLocaleString('en-IN')}`);
  console.log(`- Net Profit: ₹${(finalStats.data.data.summary.netProfit || 0).toLocaleString('en-IN')}`);
  console.log(`- Completion Rate: ${
    finalStats.data.data.summary.totalBookings ?
    Math.round(((finalStats.data.data.summary.completedBookings || 0) / finalStats.data.data.summary.totalBookings) * 100) :
    0
  }%`);

  console.log('\n✅ Test data populated successfully!');
  console.log('🎉 Dashboard now has meaningful data to display!');
}

populateTestData().catch(console.error);