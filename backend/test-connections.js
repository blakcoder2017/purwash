require('dotenv').config();
const mongoose = require('mongoose');

// Try different connection approaches
const testConnections = async () => {
  console.log('Testing MongoDB connection approaches...\n');
  
  // 1. Try the original URI with minimal options
  console.log('1. Testing original URI with minimal options...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
      family: 4 // Force IPv4
    });
    console.log('✅ Original URI with minimal options: SUCCESS');
    await mongoose.disconnect();
    return;
  } catch (err) {
    console.log('❌ Original URI with minimal options: FAILED');
    console.log('   Error:', err.message);
  }
  
  // 2. Try with direct connection (no SRV)
  console.log('\n2. Testing direct connection (no SRV)...');
  try {
    const directURI = process.env.MONGO_URI.replace('mongodb+srv://', 'mongodb://');
    console.log('   Direct URI:', directURI.substring(0, 50) + '...');
    
    await mongoose.connect(directURI, {
      serverSelectionTimeoutMS: 10000,
      ssl: true,
      family: 4
    });
    console.log('✅ Direct connection: SUCCESS');
    await mongoose.disconnect();
    return;
  } catch (err) {
    console.log('❌ Direct connection: FAILED');
    console.log('   Error:', err.message);
  }
  
  // 3. Try with a different approach - check if it's a DNS issue
  console.log('\n3. Testing with DNS resolution...');
  try {
    const dns = require('dns');
    dns.resolveSrv('_mongodb._tcp.ac-5r86n5p-shard-00-00.xrlwboz.mongodb.net', (err, addresses) => {
      if (err) {
        console.log('❌ DNS SRV resolution failed:', err.message);
      } else {
        console.log('✅ DNS SRV resolution successful:', addresses);
      }
    });
    
    // Try connection with timeout
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log('✅ Connection with timeout: SUCCESS');
    await mongoose.disconnect();
    return;
  } catch (err) {
    console.log('❌ Connection with timeout: FAILED');
    console.log('   Error:', err.message);
  }
  
  console.log('\n❌ All connection attempts failed');
  console.log('Recommendation: Check MongoDB Atlas network access settings');
  console.log('Possible solutions:');
  console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
  console.log('2. Try using a VPN and whitelist that IP');
  console.log('3. Use a local MongoDB instance');
  console.log('4. Try a different MongoDB Atlas cluster');
};

testConnections().catch(console.error);
