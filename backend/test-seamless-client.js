/**
 * Test Script for Seamless Client Strategy
 * 
 * This script tests the pricing calculation and order creation flow
 * for the new seamless client onboarding system.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testItems = [
  { name: 'Wash & Fold', price: 25, quantity: 1 },
  { name: 'Special Care', price: 50, quantity: 1 }
];

const testOrder = {
  items: testItems,
  phone: '0551234567',
  clientName: 'Test Customer',
  location: {
    addressName: 'Test Location, Tamale',
    coordinates: { lat: 9.3940, lng: -0.8423 },
    saveAsLocation: true,
    locationLabel: 'Home'
  },
  paystackReference: 'test_ref_123456'
};

/**
 * Test pricing calculation
 */
async function testPricingCalculation() {
  try {
    console.log('🧮 Testing pricing calculation...');
    
    const response = await axios.post(`${API_BASE_URL}/orders/calculate`, {
      items: testItems
    });
    
    console.log('✅ Pricing calculation successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data.totalAmount;
    
  } catch (error) {
    console.error('❌ Pricing calculation failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test order creation (will fail payment verification but tests the flow)
 */
async function testOrderCreation() {
  try {
    console.log('📦 Testing order creation...');
    
    const response = await axios.post(`${API_BASE_URL}/orders`, testOrder);
    
    console.log('✅ Order creation successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Order creation failed (expected due to payment verification):');
    console.log(error.response?.data || error.message);
  }
}

/**
 * Test order tracking
 */
async function testOrderTracking() {
  try {
    console.log('🔍 Testing order tracking...');
    
    const response = await axios.get(`${API_BASE_URL}/orders/track/0551234567`);
    
    console.log('✅ Order tracking successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Order tracking failed:', error.response?.data || error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Seamless Client Strategy Tests\n');
  
  try {
    // Test 1: Pricing Calculation
    const totalAmount = await testPricingCalculation();
    console.log(`\n💰 Total amount calculated: ₵${totalAmount}\n`);
    
    // Test 2: Order Creation (expected to fail payment verification)
    await testOrderCreation();
    console.log('\n');
    
    // Test 3: Order Tracking
    await testOrderTracking();
    console.log('\n');
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testPricingCalculation,
  testOrderCreation,
  testOrderTracking,
  runTests
};
