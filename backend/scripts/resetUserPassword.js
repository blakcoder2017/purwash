const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { comparePassword } = require('../utils/password');
const User = require('../models/User');

const run = async () => {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  const explicitUri = process.argv[4];

  if (!email || !newPassword) {
    console.error('Usage: node scripts/resetUserPassword.js <email> <newPassword>');
    process.exit(1);
  }

  const uri = explicitUri || process.env.MONGO_URI || process.env.DATABASE || 'mongodb://localhost:27017/purwash';

  try {
    await mongoose.connect(uri);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H10',
        location: 'backend/scripts/resetUserPassword.js:18',
        message: 'password_reset_db_connected',
        data: {
          dbName: mongoose.connection.name || null,
          host: mongoose.connection.host || null
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H11',
        location: 'backend/scripts/resetUserPassword.js:25',
        message: 'password_reset_before_set',
        data: {
          userId: user._id ? String(user._id) : null,
          looksHashed: typeof user.password === 'string' && user.password.startsWith('$2'),
          isModifiedPassword: user.isModified('password'),
          newPasswordLength: newPassword ? String(newPassword).length : 0
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    user.password = newPassword;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H11',
        location: 'backend/scripts/resetUserPassword.js:36',
        message: 'password_reset_after_set',
        data: {
          isModifiedPassword: user.isModified('password')
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    await user.save();
    const fresh = await User.findById(user._id).select('password');
    const verifyResult = fresh ? await comparePassword(newPassword, fresh.password) : false;
    const hashParts = fresh?.password ? String(fresh.password).split('$') : [];
    const hashMeta = hashParts.length >= 3 ? { algo: hashParts[1], rounds: hashParts[2] } : null;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H14',
        location: 'backend/scripts/resetUserPassword.js:45',
        message: 'password_reset_verify_result',
        data: {
          userId: user._id ? String(user._id) : null,
          verifyResult,
          hashMeta
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H10',
        location: 'backend/scripts/resetUserPassword.js:29',
        message: 'password_reset_complete',
        data: {
          userId: user._id ? String(user._id) : null,
          role: user.role
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    console.log('Password reset complete for', email);
  } catch (error) {
    console.error('Password reset failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();
