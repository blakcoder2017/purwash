/**
 * Comprehensive Test Script for Seamless Client Strategy
 * 
 * This script tests all client and order endpoints for the new seamless client system.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testPhone = '0551234567';
const testClientName = 'Test Customer';

const testItems = [
  { name: 'Wash & Fold', price: 25, quantity: 1 },
  { name: 'Special Care', price: 50, quantity: 1 }
];

const testOrder = {
  items: testItems,
  phone: testPhone,
  clientName: testClientName,
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
 * Test client profile retrieval
 */
async function testGetClientByPhone() {
  try {
    console.log('👤 Testing get client by phone...');

    const response = await axios.get(`${API_BASE_URL}/clients/${testPhone}`);

    console.log('✅ Get client by phone successful:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    const status = error.response?.status;
    if (status === 404) {
      console.warn('⚠️ Client not found; skipping client-specific tests.');
      return false;
    }
    console.error('❌ Get client by phone failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test client order history
 */
async function testGetClientOrders() {
  try {
    console.log('📋 Testing get client orders...');
    
    const response = await axios.get(`${API_BASE_URL}/clients/${testPhone}/orders`);
    
    console.log('✅ Get client orders successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Get client orders failed:', error.response?.data || error.message);
  }
}

/**
 * Test client statistics
 */
async function testGetClientStats() {
  try {
    console.log('📊 Testing get client stats...');
    
    const response = await axios.get(`${API_BASE_URL}/clients/${testPhone}/stats`);
    
    console.log('✅ Get client stats successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Get client stats failed:', error.response?.data || error.message);
  }
}

/**
 * Test update client profile
 */
async function testUpdateClientProfile() {
  try {
    console.log('✏️ Testing update client profile...');
    
    const response = await axios.patch(`${API_BASE_URL}/clients/${testPhone}`, {
      name: 'Updated Customer Name',
      preferences: {
        preferredServiceType: 'wash_and_iron',
        preferredBagSize: 'large',
        notifications: {
          sms: true,
          whatsapp: false
        }
      }
    });
    
    console.log('✅ Update client profile successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Update client profile failed:', error.response?.data || error.message);
  }
}

/**
 * Test add saved location
 */
async function testAddSavedLocation() {
  try {
    console.log('📍 Testing add saved location...');
    
    const response = await axios.post(`${API_BASE_URL}/clients/${testPhone}/locations`, {
      label: 'Office',
      address: 'Office Address, Tamale',
      coordinates: { lat: 9.4000, lng: -0.8500 },
      isDefault: false
    });
    
    console.log('✅ Add saved location successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Add saved location failed:', error.response?.data || error.message);
  }
}

/**
 * Test order tracking
 */
async function testOrderTracking() {
  try {
    console.log('🔍 Testing order tracking...');
    
    const response = await axios.get(`${API_BASE_URL}/orders/by-phone/${testPhone}`);
    
    console.log('✅ Order tracking successful:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Order tracking failed:', error.response?.data || error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Seamless Client Strategy Tests\n');
  
  try {
    // Test 1: Pricing Calculation
    const totalAmount = await testPricingCalculation();
    console.log(`\n💰 Total amount calculated: ₵${totalAmount}\n`);
    
    // Test 2: Order Creation (expected to fail payment verification)
    await testOrderCreation();
    console.log('\n');
    
    const clientExists = await testGetClientByPhone();
    console.log('\n');
    
    if (clientExists) {
      // Test 4: Client Orders
      await testGetClientOrders();
      console.log('\n');
      
      // Test 5: Client Statistics
      await testGetClientStats();
      console.log('\n');
      
      // Test 6: Update Client Profile
      await testUpdateClientProfile();
      console.log('\n');
      
      // Test 7: Add Saved Location
      await testAddSavedLocation();
      console.log('\n');
    }
    
    // Test 8: Order Tracking (requires client/order)
    if (clientExists) {
      await testOrderTracking();
      console.log('\n');
    }
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

/**
 * Test individual endpoints
 */
async function testPricingOnly() {
  console.log('🧮 Testing pricing calculation only...');
  await testPricingCalculation();
}

async function testClientOnly() {
  console.log('👤 Testing client endpoints only...');
  const clientExists = await testGetClientByPhone();
  console.log('\n');
  if (!clientExists) {
    return;
  }
  await testGetClientOrders();
  console.log('\n');
  await testGetClientStats();
  console.log('\n');
  await testUpdateClientProfile();
  console.log('\n');
  await testAddSavedLocation();
}

// Run tests if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'pricing':
      testPricingOnly();
      break;
    case 'client':
      testClientOnly();
      break;
    default:
      runAllTests();
  }
}

module.exports = {
  testPricingCalculation,
  testOrderCreation,
  testGetClientByPhone,
  testGetClientOrders,
  testGetClientStats,
  testUpdateClientProfile,
  testAddSavedLocation,
  testOrderTracking,
  runAllTests
};
