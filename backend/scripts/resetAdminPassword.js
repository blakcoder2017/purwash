const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const AdminUser = require('../models/AdminUser');
const bcrypt = require('bcryptjs');

const run = async () => {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  const explicitUri = process.argv[4];

  if (!email || !newPassword) {
    console.error('Usage: node scripts/resetAdminPassword.js <email> <newPassword> [mongoUri]');
    process.exit(1);
  }

  const uri = explicitUri || process.env.DATABASE || process.env.MONGO_URI || 'mongodb://localhost:27017/purwash';

  try {
    await mongoose.connect(uri);
    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      console.error('Admin user not found');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.password = hashedPassword;
    admin.loginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    console.log(`Admin password reset complete for ${email}`);
  } catch (error) {
    console.error('Admin password reset failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();
