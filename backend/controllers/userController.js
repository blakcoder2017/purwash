const User = require('../models/User');
const paystack = require('../utils/paystack');

// Verify MoMo and setup Paystack subaccount for existing users
exports.verifyAndSetupMomo = async (req, res) => {
  try {
    const { userId, momoNumber, momoNetwork, businessName } = req.body;

    // 1. Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Resolve MoMo Name (Verification)
    const resolve = await paystack.get(`/bank/resolve?account_number=${momoNumber}&bank_code=${momoNetwork.toUpperCase()}`);
    const resolvedName = resolve.data.data.account_name;

    // 3. Create Paystack Subaccount
    const subaccount = await paystack.post('/subaccount', {
      business_name: businessName || user.businessName || user.profile.firstName,
      settlement_bank: momoNetwork.toUpperCase(),
      account_number: momoNumber,
      percentage_charge: 0,
      description: `weWash Partner: ${user.profile.firstName || 'Partner'}`
    });

    // 4. Update User with payment info
    user.momo = {
      number: momoNumber,
      network: momoNetwork,
      resolvedName,
      isVerified: true
    };
    
    user.paystack = {
      subaccountCode: subaccount.data.data.subaccount_code
    };

    await user.save();
    
    res.json({ 
      success: true, 
      user: { 
        id: user._id, 
        name: user.profile.firstName || user.businessName, 
        resolvedName,
        subaccountCode: user.paystack.subaccountCode
      } 
    });

  } catch (error) {
    const message = error.response?.data?.message || error.message;
    res.status(400).json({ success: false, message });
  }
};

exports.registerPartner = async (req, res) => {
  try {
    const { name, phone, password, role, momoNumber, momoNetwork, businessName, location } = req.body;

    // 1. Resolve MoMo Name (Verification)
    // Paystack requires account_number and bank_code (mtn, vod, atl)
    const resolve = await paystack.get(`/bank/resolve?account_number=${momoNumber}&bank_code=${momoNetwork.toUpperCase()}`);
    const resolvedName = resolve.data.data.account_name;

    // 2. Create Paystack Subaccount
    // This allows the "Split" to happen automatically when a client pays
    const subaccount = await paystack.post('/subaccount', {
      business_name: businessName || name,
      settlement_bank: momoNetwork.toUpperCase(),
      account_number: momoNumber,
      percentage_charge: 0, // We take our cut via the "Split" logic, not subaccount fee
      description: `weWash Partner: ${name}`
    });

    // 3. Save User
    const user = new User({
      email: `${phone.toLowerCase()}@wewash.com`, // Generate email from phone
      password,
      role: role || 'partner',
      profile: {
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1] || '',
        phone
      },
      businessName,
      location,
      momo: {
        number: momoNumber,
        network: momoNetwork,
        resolvedName,
        isVerified: true
      },
      paystack: {
        subaccountCode: subaccount.data.data.subaccount_code
      }
    });

    await user.save();
    res.status(201).json({ success: true, user: { id: user._id, name: user.profile.firstName, resolvedName } });

  } catch (error) {
    const message = error.response?.data?.message || error.message;
    res.status(400).json({ success: false, message });
  }
};

exports.updateProfile = async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  // Senior Guard: Blacklist sensitive fields from being updated via this route
  const forbiddenFields = ['role', 'paystack', 'wallet', 'paymentInfo', 'password'];
  forbiddenFields.forEach(field => delete updates[field]);

  try {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};