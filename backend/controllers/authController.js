const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const mongoose = require('mongoose');
const { comparePassword } = require('../utils/password');
const paystack = require('../utils/paystack');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { email, password, role = 'client', profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { 'profile.phone': profile.phone }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create new user with complete schema fields
    const user = new User({
      email,
      password,
      role,
      profile: {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone,
        avatar: profile.avatar || ''
      },
      isActive: true,
      lastLogin: new Date(),
      
      // Rider/Partner specific fields (with defaults)
      businessName: profile.businessName || '',
      location: {
        address: profile.address || '',
        lat: profile.lat || null,
        lng: profile.lng || null
      },
      momo: {
        number: profile.momoNumber || '',
        network: profile.momoNetwork || null,
        resolvedName: '',
        isVerified: false
      },
      
      // Paystack Integration (empty until setup)
      paystack: {
        subaccountCode: '',
        recipientCode: ''
      },

      // Wallet fields (default values)
      wallet: {
        totalEarned: 0,
        pendingBalance: 0
      },
      
      isOnline: false,
      bio: '',
      profilePicture: '',
      operatingHours: {
        open: "08:00",
        close: "18:00"
      },
      accountStatus: 'active',
      banReason: '',
      strikeCount: 0,
      
      // Client specific fields (empty array for all roles initially)
      addresses: []
    });

    await user.save();

    // Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // #region agent log
    const readPref = mongoose.connection.getClient()?.readPreference?.mode || null;
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H2',
        location: 'backend/controllers/authController.js:112',
        message: 'auth_login_attempt',
        data: {
          hasEmail: Boolean(email),
          hasPassword: Boolean(password),
          passwordLength: password ? String(password).length : 0,
          dbName: mongoose.connection.name || null,
          dbHost: mongoose.connection.host || null,
          readPreference: readPref
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H6',
          location: 'backend/controllers/authController.js:116',
          message: 'auth_login_user_not_found',
          data: { emailProvided: Boolean(email) },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H7',
          location: 'backend/controllers/authController.js:126',
          message: 'auth_login_inactive',
          data: { accountStatus: user.accountStatus },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check account status
    if (user.accountStatus === 'banned') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H8',
          location: 'backend/controllers/authController.js:136',
          message: 'auth_login_banned',
          data: { accountStatus: user.accountStatus },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      return res.status(401).json({
        success: false,
        message: 'Account is banned'
      });
    }

    // Verify password
    // #region agent log
    const loginHashParts = user.password ? String(user.password).split('$') : [];
    const loginHashMeta = loginHashParts.length >= 3 ? { algo: loginHashParts[1], rounds: loginHashParts[2] } : null;
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H12',
        location: 'backend/controllers/authController.js:140',
        message: 'auth_login_password_check',
        data: {
          userId: user._id ? String(user._id) : null,
          looksHashed: typeof user.password === 'string' && user.password.startsWith('$2'),
          role: user.role,
          hashMeta: loginHashMeta,
          dbHost: mongoose.connection.host || null
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    const isPasswordValid = await comparePassword(password, user.password);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H13',
        location: 'backend/controllers/authController.js:149',
        message: 'auth_login_password_result',
        data: {
          userId: user._id ? String(user._id) : null,
          isPasswordValid
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    if (!isPasswordValid) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H9',
          location: 'backend/controllers/authController.js:145',
          message: 'auth_login_password_mismatch',
          data: {
            emailProvided: Boolean(email),
            userId: user._id ? String(user._id) : null,
            role: user.role,
            dbName: mongoose.connection.name || null
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H3',
        location: 'backend/controllers/authController.js:156',
        message: 'auth_login_success',
        data: {
          role: user.role,
          isActive: user.isActive,
          accountStatus: user.accountStatus
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile'
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { profile = {}, businessName, bio, operatingHours, location } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile fields
    if (profile.firstName) user.profile.firstName = profile.firstName;
    if (profile.lastName) user.profile.lastName = profile.lastName;
    if (profile.phone) user.profile.phone = profile.phone;
    if (profile.avatar) user.profile.avatar = profile.avatar;

    if (typeof businessName === 'string') {
      user.businessName = businessName;
    }
    if (typeof bio === 'string') {
      user.bio = bio;
    }
    if (operatingHours?.open || operatingHours?.close) {
      user.operatingHours = {
        open: operatingHours.open || user.operatingHours?.open,
        close: operatingHours.close || user.operatingHours?.close
      };
    }
    if (location?.address || location?.lat || location?.lng) {
      user.location = {
        address: location.address || user.location?.address,
        lat: location.lat ?? user.location?.lat,
        lng: location.lng ?? user.location?.lng
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
};

/**
 * Refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh token'
    });
  }
};

/**
 * Verify and setup MoMo
 */
const verifyAndSetupMomo = async (req, res) => {
  const { momoNumber, momoNetwork, businessName } = req.body;
  const user = await User.findById(req.user.id);

  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H2',
        location: 'backend/controllers/authController.js:491',
        message: 'verify_momo_start',
        data: {
          userId: req.user?.id || null,
          momoNetwork,
          keyType: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_')
            ? 'live'
            : process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_')
              ? 'test'
              : 'unknown'
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    // 1. Resolve Momo Name (Verify the account exists)
    // For Ghana MoMo, the bank_code is 'MTN', 'VOD', or 'TGO'
    const resolve = await paystack.get(`/bank/resolve?account_number=${momoNumber}&bank_code=${momoNetwork.toUpperCase()}`);
    const resolvedName = resolve.data.data.account_name;

    // 2. Create Subaccount on Paystack
    const subaccount = await paystack.post('/subaccount', {
      business_name: businessName || user.businessName || user.profile.firstName,
      settlement_bank: momoNetwork.toUpperCase(),
      account_number: momoNumber,
      percentage_charge: 10, // Platform takes 10% of their share (optional)
      description: `weWash Partner: ${user.profile.firstName}`
    });

    // 3. Create Transfer Recipient (For manual payouts/wallet features)
    const recipient = await paystack.post('/transferrecipient', {
      type: "mobile_money",
      name: resolvedName,
      account_number: momoNumber,
      bank_code: momoNetwork.toUpperCase(),
      currency: "GHS"
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H3',
        location: 'backend/controllers/authController.js:515',
        message: 'verify_momo_recipient_created',
        data: {
          userId: req.user?.id || null,
          keyType: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_')
            ? 'live'
            : process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_')
              ? 'test'
              : 'unknown'
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    // Update User in DB
    user.momo = {
      number: momoNumber,
      network: momoNetwork,
      resolvedName,
      isVerified: true
    };
    
    user.paystack = {
      subaccountCode: subaccount.data.data.subaccount_code,
      recipientCode: recipient.data.data.recipient_code
    };
    
    await user.save();

    res.json({ 
      success: true, 
      data: {
        resolvedName,
        subaccountCode: subaccount.data.data.subaccount_code
      }
    });
  } catch (error) {
    console.error('Momo verification error:', error);
    res.status(400).json({ success: false, message: "Momo Verification Failed" });
  }
};

/**
 * Admin login
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const AdminUser = require('../models/AdminUser');
    const admin = await AdminUser.findByCredentials(email, password);
    
    // Convert to plain object and extract only necessary fields for JWT
    const adminPayload = {
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role
    };
    
    const token = generateToken(adminPayload);
    
    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          profile: admin.profile
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user profile completeness information
 */
const getProfileCompleteness = async (req, res) => {
  try {
    const user = req.user;
    
    const completeness = user.getProfileCompleteness();
    const missingFields = user.getMissingFields();
    
    res.json({
      success: true,
      data: {
        completeness,
        missingFields,
        isComplete: completeness === 100,
        totalFields: missingFields.length + Math.floor(completeness * missingFields.length / (100 - completeness)) || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  verifyAndSetupMomo,
  getProfileCompleteness
};