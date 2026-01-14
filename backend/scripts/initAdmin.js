const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
require('dotenv').config();

// Initialize default admin user
async function initAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.DATABASE || 'mongodb://localhost:27017/purwash');
    
    console.log('Connected to MongoDB');
    
    // Create default admin
    const defaultAdmin = await AdminUser.createDefaultAdmin();
    
    if (defaultAdmin.isNew) {
      console.log('✅ Default admin user created successfully');
      console.log('📧 Email: admin@purwash.com');
      console.log('🔑 Password: admin123456');
      console.log('👤 Role: super_admin');
    } else {
      console.log('ℹ️ Default admin user already exists');
    }
    
    // List all admin users
    const adminUsers = await AdminUser.find({}).select('-password');
    console.log('\n📋 All Admin Users:');
    adminUsers.forEach(admin => {
      console.log(`- ${admin.username} (${admin.email}) - ${admin.role} - ${admin.isActive ? 'Active' : 'Inactive'}`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the initialization
initAdmin();
