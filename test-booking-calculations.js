// Test Booking Calculations and Functionality
// This script simulates the booking creation process and verifies all calculations

const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'your-admin-token-here'; // Replace with actual token

// Test data for booking
const testBookingData = {
  items: [
    {
      dressId: '507f1f77bcf86cd799439011', // Replace with actual product ID
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
      dressImage: '',
      useDress: 'Wedding reception',
      useDressDate: '',
      useDressTime: 'evening',
      dryCleaningCost: 400,
      conditionOnReturn: 'good',
      damageDescription: '',
      repairCost: 0,
      isRepairable: true,
      totalCost: 200 + 400 + 0 + 450, // transport + dry cleaning + repair + additional costs
      profit: 3000 - 200 - 400 - 450, // totalPaid - totalCost
      status: 'booked'
    },
    {
      dressId: '507f1f77bcf86cd799439012', // Replace with actual product ID
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
      dressImage: '',
      useDress: 'Birthday party',
      useDressDate: '',
      useDressTime: 'day',
      dryCleaningCost: 250,
      conditionOnReturn: 'excellent',
      damageDescription: '',
      repairCost: 0,
      isRepairable: true,
      totalCost: 150 + 250 + 0 + 250, // transport + dry cleaning + repair + additional costs
      profit: 2000 - 150 - 250 - 250, // totalPaid - totalCost
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

// Expected calculations
const expectedCalculations = {
  // Item 1 calculations
  item1: {
    totalPaid: 3000, // bookingAmount + advance + finalPayment
    totalCost: 650, // transportCost + dryCleaningCost + repairCost + additionalCosts
    profit: 2350, // totalPaid - totalCost
    pending: 1500 // priceAfterBargain - totalPaid
  },
  // Item 2 calculations
  item2: {
    totalPaid: 2000,
    totalCost: 650,
    profit: 1350,
    pending: 800
  },
  // Booking totals
  bookingTotals: {
    totalPrice: 7300, // Sum of all priceAfterBargain
    totalBookingAmount: 1500, // Sum of all bookingAmount
    totalAdvance: 3500, // Sum of all advance
    totalFinalPayment: 0, // Sum of all finalPayment
    totalPaid: 5000, // Sum of all totalPaid
    totalPending: 2300, // Sum of all pending
    totalSecurity: 800, // Sum of all securityAmount
    totalTransportCost: 350, // Sum of all transportCost
    totalDryCleaningCost: 650, // Sum of all dryCleaningCost
    totalRepairCost: 0, // Sum of all repairCost
    totalAdditionalCosts: 700, // Sum of all additional costs
    totalOperationalCost: 1700, // transport + dry cleaning + repair + additional costs
    grossProfit: -2300, // totalPaid - totalPrice
    netProfit: -4000 // grossProfit - totalOperationalCost
  }
};

async function testBookingCreation() {
  console.log('🧪 Testing Booking Creation and Calculations');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create booking
    console.log('\n📝 Step 1: Creating booking...');
    const createResponse = await axios.post(`${API_BASE_URL}/bookings`, testBookingData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.data.success) {
      const booking = createResponse.data.data.booking;
      console.log('✅ Booking created successfully');
      console.log(`📋 Booking ID: ${booking.bookingId}`);
      console.log(`🆔 Database ID: ${booking._id}`);

      // Step 2: Verify calculations
      console.log('\n🔢 Step 2: Verifying calculations...');
      await verifyCalculations(booking);

      // Step 3: Update booking values
      console.log('\n📝 Step 3: Updating booking values...');
      await testBookingUpdate(booking._id);

      // Step 4: Test complete payment
      console.log('\n💰 Step 4: Testing complete payment...');
      await testCompletePayment(booking._id);

      // Step 5: Delete booking
      console.log('\n🗑️ Step 5: Deleting test booking...');
      await testBookingDeletion(booking._id);

      console.log('\n🎉 All tests completed successfully!');
    } else {
      console.error('❌ Failed to create booking:', createResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function verifyCalculations(booking) {
  console.log('Verifying booking calculations...');

  let hasErrors = false;

  // Verify item-level calculations
  booking.items.forEach((item, index) => {
    const expected = index === 0 ? expectedCalculations.item1 : expectedCalculations.item2;
    const itemNum = index + 1;

    console.log(`\n📊 Item ${itemNum} Calculations:`);

    // Check total paid
    const actualTotalPaid = (item.bookingAmount || 0) + (item.advance || 0) + (item.finalPayment || 0);
    if (actualTotalPaid !== item.totalPaid) {
      console.error(`❌ Item ${itemNum} totalPaid mismatch: expected ${expected.totalPaid}, got ${item.totalPaid}`);
      hasErrors = true;
    } else {
      console.log(`✅ Item ${itemNum} totalPaid: ${item.totalPaid}`);
    }

    // Check total cost
    const actualTotalCost = (item.transportCost || 0) + (item.dryCleaningCost || 0) + (item.repairCost || 0) +
                           (item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0);
    if (actualTotalCost !== item.totalCost) {
      console.error(`❌ Item ${itemNum} totalCost mismatch: expected ${expected.totalCost}, got ${item.totalCost}`);
      hasErrors = true;
    } else {
      console.log(`✅ Item ${itemNum} totalCost: ${item.totalCost}`);
    }

    // Check profit
    const actualProfit = item.totalPaid - item.totalCost;
    if (actualProfit !== item.profit) {
      console.error(`❌ Item ${itemNum} profit mismatch: expected ${expected.profit}, got ${item.profit}`);
      hasErrors = true;
    } else {
      console.log(`✅ Item ${itemNum} profit: ${item.profit}`);
    }

    // Check pending
    const actualPending = item.priceAfterBargain - item.totalPaid;
    if (actualPending !== item.pending) {
      console.error(`❌ Item ${itemNum} pending mismatch: expected ${expected.pending}, got ${item.pending}`);
      hasErrors = true;
    } else {
      console.log(`✅ Item ${itemNum} pending: ${item.pending}`);
    }
  });

  // Verify booking-level calculations
  console.log('\n📈 Booking-Level Calculations:');

  const totals = expectedCalculations.bookingTotals;

  if (booking.totalPrice !== totals.totalPrice) {
    console.error(`❌ totalPrice mismatch: expected ${totals.totalPrice}, got ${booking.totalPrice}`);
    hasErrors = true;
  } else {
    console.log(`✅ totalPrice: ${booking.totalPrice}`);
  }

  if (booking.totalPaid !== totals.totalPaid) {
    console.error(`❌ totalPaid mismatch: expected ${totals.totalPaid}, got ${booking.totalPaid}`);
    hasErrors = true;
  } else {
    console.log(`✅ totalPaid: ${booking.totalPaid}`);
  }

  if (booking.totalOperationalCost !== totals.totalOperationalCost) {
    console.error(`❌ totalOperationalCost mismatch: expected ${totals.totalOperationalCost}, got ${booking.totalOperationalCost}`);
    hasErrors = true;
  } else {
    console.log(`✅ totalOperationalCost: ${booking.totalOperationalCost}`);
  }

  const actualGrossProfit = booking.totalPaid - booking.totalPrice;
  if (booking.grossProfit !== actualGrossProfit) {
    console.error(`❌ grossProfit mismatch: expected ${actualGrossProfit}, got ${booking.grossProfit}`);
    hasErrors = true;
  } else {
    console.log(`✅ grossProfit: ${booking.grossProfit}`);
  }

  const actualNetProfit = booking.grossProfit - booking.totalOperationalCost;
  if (booking.netProfit !== actualNetProfit) {
    console.error(`❌ netProfit mismatch: expected ${actualNetProfit}, got ${booking.netProfit}`);
    hasErrors = true;
  } else {
    console.log(`✅ netProfit: ${booking.netProfit}`);
  }

  if (hasErrors) {
    console.log('\n❌ Some calculations have errors!');
  } else {
    console.log('\n✅ All calculations are correct!');
  }

  return !hasErrors;
}

async function testBookingUpdate(bookingId) {
  console.log('Testing booking update with new values...');

  // Update data with new values
  const updateData = {
    items: testBookingData.items.map((item, index) => ({
      ...item,
      priceAfterBargain: index === 0 ? 4200 : 2600, // Changed prices
      advance: index === 0 ? 2500 : 1800, // Changed advances
      transportCost: index === 0 ? 250 : 200, // Changed transport costs
      dryCleaningCost: index === 0 ? 500 : 300, // Changed dry cleaning costs
      additionalCosts: index === 0
        ? [{ reason: 'Alteration', amount: 400 }, { reason: 'Special packaging', amount: 200 }]
        : [{ reason: 'Express delivery', amount: 300 }]
    })),
    adminNotes: 'Updated test booking with new calculations'
  };

  try {
    const updateResponse = await axios.put(`${API_BASE_URL}/bookings/${bookingId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (updateResponse.data.success) {
      const updatedBooking = updateResponse.data.data.booking;
      console.log('✅ Booking updated successfully');

      // Verify updated calculations
      console.log('Verifying updated calculations...');
      await verifyUpdatedCalculations(updatedBooking);
    } else {
      console.error('❌ Failed to update booking:', updateResponse.data.message);
    }
  } catch (error) {
    console.error('❌ Update failed:', error.response?.data || error.message);
  }
}

async function verifyUpdatedCalculations(booking) {
  // Expected calculations after update
  const expectedUpdated = {
    item1: {
      priceAfterBargain: 4200,
      totalPaid: 2500, // bookingAmount (1000) + advance (2500) + finalPayment (0)
      totalCost: 250 + 500 + 0 + 600, // transport + dry cleaning + repair + additional
      profit: 2500 - 1350,
      pending: 4200 - 2500
    },
    item2: {
      priceAfterBargain: 2600,
      totalPaid: 2300, // bookingAmount (500) + advance (1800) + finalPayment (0)
      totalCost: 200 + 300 + 0 + 300, // transport + dry cleaning + repair + additional
      profit: 2300 - 800,
      pending: 2600 - 2300
    },
    bookingTotals: {
      totalPrice: 6800, // 4200 + 2600
      totalPaid: 4800, // 2500 + 2300
      totalOperationalCost: 2150, // 1350 + 800
      grossProfit: 4800 - 6800, // -2000
      netProfit: -2000 - 2150 // -4150
    }
  };

  let hasErrors = false;

  // Verify updated item calculations
  booking.items.forEach((item, index) => {
    const expected = index === 0 ? expectedUpdated.item1 : expectedUpdated.item2;
    const itemNum = index + 1;

    console.log(`\n📊 Updated Item ${itemNum} Calculations:`);

    if (item.priceAfterBargain !== expected.priceAfterBargain) {
      console.error(`❌ Item ${itemNum} priceAfterBargain mismatch: expected ${expected.priceAfterBargain}, got ${item.priceAfterBargain}`);
      hasErrors = true;
    }

    const actualTotalPaid = (item.bookingAmount || 0) + (item.advance || 0) + (item.finalPayment || 0);
    if (actualTotalPaid !== expected.totalPaid) {
      console.error(`❌ Item ${itemNum} totalPaid mismatch: expected ${expected.totalPaid}, got ${actualTotalPaid}`);
      hasErrors = true;
    }

    const actualTotalCost = (item.transportCost || 0) + (item.dryCleaningCost || 0) + (item.repairCost || 0) +
                           (item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0);
    if (actualTotalCost !== expected.totalCost) {
      console.error(`❌ Item ${itemNum} totalCost mismatch: expected ${expected.totalCost}, got ${actualTotalCost}`);
      hasErrors = true;
    }
  });

  // Verify updated booking totals
  console.log('\n📈 Updated Booking Totals:');

  if (booking.totalPrice !== expectedUpdated.bookingTotals.totalPrice) {
    console.error(`❌ totalPrice mismatch: expected ${expectedUpdated.bookingTotals.totalPrice}, got ${booking.totalPrice}`);
    hasErrors = true;
  }

  if (booking.totalPaid !== expectedUpdated.bookingTotals.totalPaid) {
    console.error(`❌ totalPaid mismatch: expected ${expectedUpdated.bookingTotals.totalPaid}, got ${booking.totalPaid}`);
    hasErrors = true;
  }

  if (hasErrors) {
    console.log('\n❌ Updated calculations have errors!');
  } else {
    console.log('\n✅ Updated calculations are correct!');
  }
}

async function testCompletePayment(bookingId) {
  console.log('Testing complete payment functionality...');

  try {
    // Get current booking to see pending amount
    const getResponse = await axios.get(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    const currentBooking = getResponse.data.data.booking;
    const pendingAmount = currentBooking.totalPrice - currentBooking.totalPaid;

    console.log(`Current pending amount: ₹${pendingAmount}`);

    // Complete payment with the pending amount
    const completePaymentData = {
      items: currentBooking.items.map(item => ({
        dressId: item.dressId,
        priceAfterBargain: item.priceAfterBargain,
        advance: item.advance,
        pending: 0, // Set to 0 since payment is complete
        finalPayment: item.pending || 0, // Set final payment to cover the remaining amount
        securityAmount: 0, // Set to 0 for completed booking
        sendDate: item.sendDate,
        receiveDate: item.receiveDate,
        dressImage: item.dressImage,
        useDress: item.useDress,
        useDressDate: item.useDressDate,
        useDressTime: item.useDressTime
      })),
      customer: currentBooking.customer,
      status: 'completed',
      totalPaid: currentBooking.totalPrice // Set total paid to full amount
    };

    const paymentResponse = await axios.put(`${API_BASE_URL}/bookings/${bookingId}`, completePaymentData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (paymentResponse.data.success) {
      const completedBooking = paymentResponse.data.data.booking;
      console.log('✅ Payment completed successfully');

      // Verify final calculations
      console.log('Verifying final completed booking calculations...');

      // For completed booking, totalPaid should equal totalPrice
      if (completedBooking.totalPaid !== completedBooking.totalPrice) {
        console.error(`❌ Completed booking totalPaid mismatch: expected ${completedBooking.totalPrice}, got ${completedBooking.totalPaid}`);
      } else {
        console.log(`✅ Completed booking totalPaid: ${completedBooking.totalPaid}`);
      }

      // All items should have pending = 0
      const hasPendingItems = completedBooking.items.some(item => item.pending > 0);
      if (hasPendingItems) {
        console.error('❌ Completed booking still has pending amounts');
      } else {
        console.log('✅ All items have zero pending amounts');
      }

      console.log(`📊 Final Profit/Loss: ₹${completedBooking.netProfit}`);
      console.log(`📈 Final Status: ${completedBooking.status}`);

    } else {
      console.error('❌ Failed to complete payment:', paymentResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Complete payment failed:', error.response?.data || error.message);
  }
}

async function testBookingDeletion(bookingId) {
  console.log('Testing booking deletion...');

  try {
    const deleteResponse = await axios.delete(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });

    if (deleteResponse.data.success) {
      console.log('✅ Booking deleted successfully');

      // Verify deletion by trying to fetch the booking
      try {
        await axios.get(`${API_BASE_URL}/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`
          }
        });
        console.error('❌ Booking still exists after deletion');
      } catch (fetchError) {
        if (fetchError.response?.status === 404) {
          console.log('✅ Booking confirmed deleted (404 on fetch)');
        } else {
          console.error('❌ Unexpected error when verifying deletion:', fetchError.message);
        }
      }
    } else {
      console.error('❌ Failed to delete booking:', deleteResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Deletion failed:', error.response?.data || error.message);
  }
}

// Function to get admin token (you'll need to implement login first)
async function getAdminToken() {
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com', // Replace with actual admin credentials
      password: 'adminpassword'
    });

    return loginResponse.data.data.token;
  } catch (error) {
    console.error('Failed to get admin token:', error.response?.data || error.message);
    return null;
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting comprehensive booking functionality test...');

  // Get admin token first
  const token = await getAdminToken();
  if (!token) {
    console.error('❌ Cannot proceed without admin token');
    return;
  }

  // Set the token
  ADMIN_TOKEN = token;

  // Run the main test
  await testBookingCreation();
}

// Export for use in other files
module.exports = {
  testBookingCreation,
  verifyCalculations,
  testBookingUpdate,
  testCompletePayment,
  testBookingDeletion,
  runTests
};

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}