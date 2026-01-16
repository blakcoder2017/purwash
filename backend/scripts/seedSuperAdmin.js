const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

const run = async () => {
  const email = process.argv[2];
  const password = process.argv[3];
  const explicitUri = process.argv[4];

  if (!email || !password) {
    console.error('Usage: node scripts/seedSuperAdmin.js <email> <password> [mongoUri]');
    process.exit(1);
  }

  const uri = explicitUri || process.env.DATABASE || process.env.MONGO_URI || 'mongodb://localhost:27017/purwash';

  try {
    await mongoose.connect(uri);

    const existing = await AdminUser.findOne({ email });
    if (existing) {
      console.log('Admin user already exists:', email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new AdminUser({
      username: email.split('@')[0],
      email,
      password: hashedPassword,
      role: 'super_admin',
      profile: {
        firstName: 'Super',
        lastName: 'Admin'
      }
    });

    await admin.save();
    console.log(`Super admin created: ${email}`);
  } catch (error) {
    console.error('Super admin seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();
