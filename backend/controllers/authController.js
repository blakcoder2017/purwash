const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
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

    // Create new user
    const user = new User({
      email,
      password,
      role,
      profile: {
        ...profile,
        phone: profile.phone
      }
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

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check account status
    if (user.accountStatus === 'banned') {
      return res.status(401).json({
        success: false,
        message: 'Account is banned'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
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
    const { profile } = req.body;
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  verifyAndSetupMomo
};