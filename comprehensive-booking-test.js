// Comprehensive Booking Test Suite
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
let adminToken = '';

async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin with test password...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@clothingrental.com',
      password: 'testadmin123'
    });

    adminToken = response.data.data.token;
    console.log('✅ Admin login successful');
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function getTestCategory() {
  try {
    console.log('📂 Getting test category...');

    // Try to get existing categories
    const categoriesResponse = await axios.get(`${API_BASE_URL}/categories?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (categoriesResponse.data.data && categoriesResponse.data.data.length > 0) {
      const categoryId = categoriesResponse.data.data[0]._id;
      console.log('✅ Using existing category:', categoryId);
      return categoryId;
    }

    // If no categories exist, create one
    console.log('No existing categories, creating test category...');
    const categoryData = {
      name: 'Test Clothing ' + Date.now(),
      description: 'Test category for booking functionality',
      image: 'https://via.placeholder.com/300x300?text=Test+Category',
      sortOrder: 1
    };

    const response = await axios.post(`${API_BASE_URL}/categories`, categoryData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Test category created:', response.data.data.category._id);
    return response.data.data.category._id;

  } catch (error) {
    console.error('❌ Failed to get/create category:', error.response?.data?.message || error.message);
    return null;
  }
}

async function createTestProducts() {
  console.log('📦 Creating test products...');

  // First get a test category
  const categoryId = await getTestCategory();
  if (!categoryId) {
    console.error('❌ Cannot create products without a category');
    return [];
  }

  const testProducts = [
    {
      name: 'Test Wedding Dress',
      description: 'Beautiful wedding dress for testing',
      categories: [categoryId],
      images: ['https://via.placeholder.com/300x400?text=Wedding+Dress'],
      price: 4500,
      originalPrice: 5000,
      merchantPrice: 4000,
      rentalDuration: 3,
      brand: 'Test Brand',
      color: 'White',
      material: 'Silk',
      condition: 'Excellent',
      sizes: [{ size: 'M', isAvailable: true, quantity: 1 }],
      isFeatured: false,
      isActive: true
    },
    {
      name: 'Test Party Dress',
      description: 'Elegant party dress for testing',
      categories: [categoryId],
      images: ['https://via.placeholder.com/300x400?text=Party+Dress'],
      price: 2800,
      originalPrice: 3000,
      merchantPrice: 2500,
      rentalDuration: 2,
      brand: 'Test Brand',
      color: 'Red',
      material: 'Cotton',
      condition: 'Very Good',
      sizes: [{ size: 'S', isAvailable: true, quantity: 1 }],
      isFeatured: false,
      isActive: true
    }
  ];

  const createdProducts = [];

  for (const product of testProducts) {
    try {
      const response = await axios.post(`${API_BASE_URL}/products`, product, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      createdProducts.push(response.data.data.product);
      console.log(`✅ Created product: ${product.name} (ID: ${response.data.data.product._id})`);
    } catch (error) {
      console.error(`❌ Failed to create product ${product.name}:`, error.response?.data || error.message);
    }
  }

  return createdProducts;
}

async function testBookingCalculations() {
  console.log('\n🧮 Testing Booking Calculations');

  // First, create test products
  const products = await createTestProducts();
  if (products.length < 2) {
    console.error('❌ Not enough test products created');
    return;
  }

  // Test booking data
  const bookingData = {
    items: [
      {
        dressId: products[0]._id,
        originalPrice: 5000,
        priceAfterBargain: 4500,
        discount: 500,
        bookingAmount: 1000,
        advance: 2000,
        pending: 1500,
        finalPayment: 0,
        totalPaid: 3000,
        securityAmount: 500,
        additionalCosts: [
          { reason: 'Alteration', amount: 300 },
          { reason: 'Special packaging', amount: 150 }
        ],
        bookingDate: new Date().toISOString().split('T')[0],
        sendDate: '',
        deliveryMethod: 'parcel',
        transportCost: 200,
        transportPaidBy: 'business',
        receiveDate: '',
        dressImage: products[0].images[0],
        useDress: 'Wedding reception',
        useDressDate: '',
        useDressTime: 'evening',
        dryCleaningCost: 400,
        conditionOnReturn: 'good',
        damageDescription: '',
        repairCost: 0,
        isRepairable: true,
        totalCost: 200 + 400 + 0 + 450, // transport + dry cleaning + repair + additional costs
        profit: 3000 - 1050, // totalPaid - totalCost
        status: 'booked'
      },
      {
        dressId: products[1]._id,
        originalPrice: 3000,
        priceAfterBargain: 2800,
        discount: 200,
        bookingAmount: 500,
        advance: 1500,
        pending: 800,
        finalPayment: 0,
        totalPaid: 2000,
        securityAmount: 300,
        additionalCosts: [
          { reason: 'Express delivery', amount: 250 }
        ],
        bookingDate: new Date().toISOString().split('T')[0],
        sendDate: '',
        deliveryMethod: 'courier',
        transportCost: 150,
        transportPaidBy: 'customer',
        receiveDate: '',
        dressImage: products[1].images[0],
        useDress: 'Birthday party',
        useDressDate: '',
        useDressTime: 'evening',
        dryCleaningCost: 250,
        conditionOnReturn: 'excellent',
        damageDescription: '',
        repairCost: 0,
        isRepairable: true,
        totalCost: 150 + 250 + 0 + 250, // transport + dry cleaning + repair + additional costs
        profit: 2000 - 650, // totalPaid - totalCost
        status: 'booked'
      }
    ],
    customer: {
      name: 'Test Customer',
      mobile: '9876543210',
      email: 'test@example.com',
      location: 'Mumbai, Maharashtra',
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '9123456789'
      },
      measurements: {
        bust: 34,
        waist: 28,
        hips: 36,
        shoulder: 14,
        length: 60,
        size: 'M'
      }
    },
    deliveryAddress: '123 Test Street, Mumbai, Maharashtra - 400001',
    rentalDuration: 3,
    returnDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'online',
    specialInstructions: 'Handle with care, dress is for special occasion',
    referenceCustomer: 'Previous Customer Reference',
    adminNotes: 'Test booking for calculation verification',
    customerNotes: 'Please ensure timely delivery',
    status: 'active'
  };

  try {
    console.log('📝 Creating test booking...');
    const createResponse = await axios.post(`${API_BASE_URL}/bookings`, bookingData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.data.success) {
      const booking = createResponse.data.data.booking;
      console.log('✅ Booking created successfully');
      console.log(`📋 Booking ID: ${booking.bookingId}`);
      console.log(`🆔 Database ID: ${booking._id}`);

      // Verify calculations
      await verifyCalculations(booking);

      // Test booking update
      await testBookingUpdate(booking._id);

      // Test complete payment
      await testCompletePayment(booking._id);

      // Test booking deletion
      await testBookingDeletion(booking._id);

      // Cleanup test products
      await cleanupTestProducts(products);

    } else {
      console.error('❌ Failed to create booking:', createResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Booking creation failed:', error.response?.data || error.message);
  }
}

async function verifyCalculations(booking) {
  console.log('\n🔍 Verifying booking calculations...');

  let hasErrors = false;

  // Expected calculations
  const expectedTotals = {
    totalPrice: 7300, // 4500 + 2800
    totalPaid: 5000,  // 3000 + 2000
    totalOperationalCost: 1700, // (200+400+450) + (150+250+250) = 1050 + 650
    grossProfit: 5000 - 7300, // -2300
    netProfit: -2300 - 1700 // -4000
  };

  console.log('Expected vs Actual:');
  console.log(`Total Price: ${expectedTotals.totalPrice} vs ${booking.totalPrice}`);
  console.log(`Total Paid: ${expectedTotals.totalPaid} vs ${booking.totalPaid}`);
  console.log(`Operational Cost: ${expectedTotals.totalOperationalCost} vs ${booking.totalOperationalCost}`);
  console.log(`Gross Profit: ${expectedTotals.grossProfit} vs ${booking.grossProfit}`);
  console.log(`Net Profit: ${expectedTotals.netProfit} vs ${booking.netProfit}`);

  // Check calculations
  if (booking.totalPrice !== expectedTotals.totalPrice) {
    console.error(`❌ totalPrice mismatch`);
    hasErrors = true;
  }
  if (booking.totalPaid !== expectedTotals.totalPaid) {
    console.error(`❌ totalPaid mismatch`);
    hasErrors = true;
  }
  if (booking.totalOperationalCost !== expectedTotals.totalOperationalCost) {
    console.error(`❌ totalOperationalCost mismatch`);
    hasErrors = true;
  }
  if (booking.grossProfit !== expectedTotals.grossProfit) {
    console.error(`❌ grossProfit mismatch`);
    hasErrors = true;
  }
  if (booking.netProfit !== expectedTotals.netProfit) {
    console.error(`❌ netProfit mismatch`);
    hasErrors = true;
  }

  // Check item-level calculations
  booking.items.forEach((item, index) => {
    const expectedTotalPaid = index === 0 ? 3000 : 2000;
    const expectedTotalCost = index === 0 ? 1050 : 650; // transport + dry cleaning + additional costs
    const expectedProfit = expectedTotalPaid - expectedTotalCost;

    if (item.totalPaid !== expectedTotalPaid) {
      console.error(`❌ Item ${index + 1} totalPaid: expected ${expectedTotalPaid}, got ${item.totalPaid}`);
      hasErrors = true;
    }
    if (item.totalCost !== expectedTotalCost) {
      console.error(`❌ Item ${index + 1} totalCost: expected ${expectedTotalCost}, got ${item.totalCost}`);
      hasErrors = true;
    }
    if (item.profit !== expectedProfit) {
      console.error(`❌ Item ${index + 1} profit: expected ${expectedProfit}, got ${item.profit}`);
      hasErrors = true;
    }
  });

  if (hasErrors) {
    console.log('❌ Some calculations have errors!');
  } else {
    console.log('✅ All calculations are correct!');
  }

  return !hasErrors;
}

async function testBookingUpdate(bookingId) {
  console.log('\n📝 Testing booking update...');

  try {
    // First get the current booking to get the actual item IDs
    const getResponse = await axios.get(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const currentBooking = getResponse.data.data.booking;

    const updateData = {
      items: currentBooking.items.map((item, index) => ({
        ...item,
        _id: undefined, // Remove _id for update
        priceAfterBargain: index === 0 ? 4200 : 2600, // Changed price
        advance: index === 0 ? 2500 : 1800, // Changed advance
        transportCost: index === 0 ? 250 : 200, // Changed transport cost
        dryCleaningCost: index === 0 ? 500 : 300, // Changed dry cleaning cost
        additionalCosts: index === 0
          ? [
              { reason: 'Alteration', amount: 400 },
              { reason: 'Special packaging', amount: 200 }
            ]
          : [
              { reason: 'Express delivery', amount: 300 }
            ]
      })),
      adminNotes: 'Updated test booking with new calculations'
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/bookings/${bookingId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (updateResponse.data.success) {
      const updatedBooking = updateResponse.data.data.booking;
      console.log('✅ Booking updated successfully');

      // Verify updated calculations
      const expectedUpdated = {
        totalPrice: 6800, // 4200 + 2600
        totalPaid: 5800,  // item1: 1000+2500+0=3500, item2: 500+1800+0=2300, total=5800
        totalOperationalCost: 2150, // (250+500+600) + (200+300+300) = 1350 + 800
        grossProfit: 5800 - 6800, // -1000
        netProfit: -1000 - 2150 // -3150
      };

      console.log('Updated booking calculations:');
      console.log(`Total Price: ${updatedBooking.totalPrice} (expected: ${expectedUpdated.totalPrice})`);
      console.log(`Total Paid: ${updatedBooking.totalPaid} (expected: ${expectedUpdated.totalPaid})`);
      console.log(`Operational Cost: ${updatedBooking.totalOperationalCost} (expected: ${expectedUpdated.totalOperationalCost})`);
      console.log(`Gross Profit: ${updatedBooking.grossProfit} (expected: ${expectedUpdated.grossProfit})`);
      console.log(`Net Profit: ${updatedBooking.netProfit} (expected: ${expectedUpdated.netProfit})`);

    } else {
      console.error('❌ Failed to update booking:', updateResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Update failed:', error.response?.data || error.message);
  }
}

async function testCompletePayment(bookingId) {
  console.log('\n💰 Testing complete payment...');

  try {
    // Get current booking
    const getResponse = await axios.get(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const currentBooking = getResponse.data.data.booking;
    const pendingAmount = currentBooking.totalPrice - currentBooking.totalPaid;

    console.log(`Current pending amount: ₹${pendingAmount}`);

    // Complete payment
    const completeData = {
      status: 'completed',
      totalPaid: currentBooking.totalPrice,
      items: currentBooking.items.map(item => ({
        ...item,
        finalPayment: item.pending || 0,
        pending: 0
      }))
    };

    const paymentResponse = await axios.put(`${API_BASE_URL}/bookings/${bookingId}`, completeData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (paymentResponse.data.success) {
      const completedBooking = paymentResponse.data.data.booking;
      console.log('✅ Payment completed successfully');

      console.log(`Final Status: ${completedBooking.status}`);
      console.log(`Total Paid: ₹${completedBooking.totalPaid}`);
      console.log(`Total Price: ₹${completedBooking.totalPrice}`);
      console.log(`Net Profit: ₹${completedBooking.netProfit}`);

      if (completedBooking.totalPaid === completedBooking.totalPrice) {
        console.log('✅ Payment completion verified');
      } else {
        console.error('❌ Payment completion not properly recorded');
      }

    } else {
      console.error('❌ Failed to complete payment:', paymentResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Complete payment failed:', error.response?.data || error.message);
  }
}

async function testBookingDeletion(bookingId) {
  console.log('\n🗑️ Testing booking deletion...');

  try {
    const deleteResponse = await axios.delete(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (deleteResponse.data.success) {
      console.log('✅ Booking deleted successfully');

      // Verify deletion
      try {
        await axios.get(`${API_BASE_URL}/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        console.error('❌ Booking still exists after deletion');
      } catch (fetchError) {
        if (fetchError.response?.status === 404) {
          console.log('✅ Booking confirmed deleted');
        }
      }
    } else {
      console.error('❌ Failed to delete booking:', deleteResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Deletion failed:', error.response?.data || error.message);
  }
}

async function cleanupTestProducts(products) {
  console.log('\n🧹 Cleaning up test products...');

  for (const product of products) {
    try {
      await axios.delete(`${API_BASE_URL}/products/${product._id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      console.log(`✅ Deleted test product: ${product.name}`);
    } catch (error) {
      console.error(`❌ Failed to delete product ${product.name}:`, error.message);
    }
  }
}

async function generateOrderSummary() {
  console.log('\n📊 Generating order summary...');

  try {
    const statsResponse = await axios.get(`${API_BASE_URL}/bookings/stats/summary`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const stats = statsResponse.data.data.summary;
    console.log('📈 Booking Statistics Summary:');
    console.log(`Total Bookings: ${stats.totalBookings}`);
    console.log(`Total Customers: ${stats.totalCustomers}`);
    console.log(`Active Bookings: ${stats.activeBookings}`);
    console.log(`Completed Bookings: ${stats.completedBookings}`);
    console.log(`Total Revenue: ₹${stats.totalRevenue?.toLocaleString() || 0}`);
    console.log(`Total Profit: ₹${stats.netProfit?.toLocaleString() || 0}`);
    console.log(`Total Operational Cost: ₹${stats.totalOperationalCost?.toLocaleString() || 0}`);

  } catch (error) {
    console.error('❌ Failed to get booking stats:', error.message);
  }
}

// Main test execution
async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Booking Functionality Test');
  console.log('=' .repeat(60));

  try {
    // Login as admin
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
      console.error('❌ Cannot proceed without admin authentication');
      return;
    }

    // Generate initial order summary
    await generateOrderSummary();

    // Run booking tests
    await testBookingCalculations();

    // Generate final order summary
    console.log('\n📋 Final Order Summary:');
    await generateOrderSummary();

    console.log('\n🎉 Comprehensive testing completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Export for use
module.exports = { runComprehensiveTest };

// Run if called directly
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}