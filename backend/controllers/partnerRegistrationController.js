const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const paystack = require('../utils/paystack');

/**
 * Step 1: Basic Information
 * - Email, password, basic profile info
 */
const stepOneBasicInfo = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { 'profile.phone': phone }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists',
        step: 1
      });
    }

    // Create user with basic info only
    const user = new User({
      email,
      password,
      role, // 'rider' or 'partner'
      profile: {
        firstName,
        lastName,
        phone,
        avatar: ''
      },
      isActive: true,
      lastLogin: new Date(),
      
      // Initialize all other fields with defaults
      businessName: '',
      location: {
        address: '',
        lat: null,
        lng: null
      },
      momo: {
        number: '',
        network: null,
        resolvedName: '',
        isVerified: false
      },
      paystack: {
        subaccountCode: '',
        recipientCode: ''
      },
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
      addresses: []
    });

    await user.save();

    // Generate temporary token for step 2
    const tempToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      registrationStep: 1
    });

    res.status(201).json({
      success: true,
      message: 'Step 1 completed successfully',
      step: 1,
      nextStep: 2,
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          role: user.role
        },
        tempToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      step: 1
    });
  }
};

/**
 * Step 2: Business/Rider Information
 * - Business name, location, operating hours, bio
 * - For riders: vehicle type, vehicle number
 */
const stepTwoBusinessInfo = async (req, res) => {
  try {
    const userId = req.user.id; // From temp token
    const { businessName, address, lat, lng, bio, operatingHours, vehicleType, vehicleNumber } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        step: 2
      });
    }

    // Update business/rider information
    user.businessName = businessName;
    user.location = {
      address: address || '',
      lat: lat || null,
      lng: lng || null
    };
    user.bio = bio || '';
    user.operatingHours = {
      open: operatingHours?.open || "08:00",
      close: operatingHours?.close || "18:00"
    };

    // Add rider-specific fields
    if (user.role === 'rider') {
      user.vehicleType = vehicleType || 'motorcycle';
      user.vehicleNumber = vehicleNumber || '';
    }

    await user.save();

    // Generate token for step 3
    const tempToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      registrationStep: 2
    });

    res.json({
      success: true,
      message: 'Step 2 completed successfully',
      step: 2,
      nextStep: 3,
      data: {
        user: {
          id: user._id,
          businessName: user.businessName,
          location: user.location,
          bio: user.bio,
          operatingHours: user.operatingHours,
          ...(user.role === 'rider' && {
            vehicleType: user.vehicleType,
            vehicleNumber: user.vehicleNumber
          })
        },
        tempToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      step: 2
    });
  }
};

/**
 * Step 3: Payment Setup & Safety
 * - MoMo information and profile picture
 * - For riders: emergency contact
 */
const stepThreePaymentSetup = async (req, res) => {
  try {
    const userId = req.user.id; // From temp token
    const { momoNumber, momoNetwork, profilePicture, emergencyContact } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        step: 3
      });
    }

    // Save MoMo info first
    user.momo = {
      number: momoNumber,
      network: momoNetwork,
      resolvedName: '', // Will be filled below
      isVerified: false // Will be updated after verification
    };

    // Try to resolve MoMo name and create recipient (optional - don't fail if this fails)
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H4',
          location: 'backend/controllers/partnerRegistrationController.js:214',
          message: 'partner_step3_paystack_start',
          data: {
            userId,
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

      console.log('Attempting to resolve MoMo name...');
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 1. Resolve MoMo Name (Verification)
      const resolve = await paystack.get(`/bank/resolve?account_number=${momoNumber}&bank_code=${momoNetwork.toUpperCase()}`);
      const resolvedName = resolve.data.data.account_name;
      
      console.log('MoMo name resolved:', resolvedName);

      // Add another delay before creating recipient
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Create Transfer Recipient (For Payouts)
      const recipient = await paystack.post('/transferrecipient', {
        type: "mobile_money",
        name: resolvedName,
        account_number: momoNumber,
        bank_code: momoNetwork.toUpperCase(),
        currency: "GHS",
        description: `PurWash Payout: ${user.profile.firstName}` 
      });

      console.log('Transfer recipient created:', recipient.data.data.recipient_code);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H5',
          location: 'backend/controllers/partnerRegistrationController.js:239',
          message: 'partner_step3_recipient_created',
          data: {
            userId,
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

      // Update with successful verification
      user.momo.resolvedName = resolvedName;
      user.momo.isVerified = true;
      
      user.paystack = {
        recipientCode: recipient.data.data.recipient_code,
        bankName: momoNetwork.toUpperCase(),
        accountName: resolvedName
      };

    } catch (paystackError) {
      console.error('Paystack verification failed, saving without verification:', paystackError.message);
      
      // Check if it's a rate limit error
      if (paystackError.response?.status === 429) {
        console.log('Paystack rate limit hit - saving without verification for now');
      }
      
      // Save without Paystack verification - user can complete later
      user.momo.resolvedName = '';
      user.momo.isVerified = false;
      
      user.paystack = {
        recipientCode: '',
        bankName: '',
        accountName: ''
      };
    }

    if (profilePicture) {
      user.profile.avatar = profilePicture;
    }

    if (emergencyContact && user.role === 'rider') {
      user.emergencyContact = emergencyContact;
    }

    await user.save();

    // Generate final token with clean payload
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: user.momo.isVerified 
        ? 'Registration completed successfully! Your payment details have been verified.'
        : 'Registration completed successfully! You can complete business verification in dashboard.',
      isComplete: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          businessName: user.businessName,
          location: user.location,
          momo: {
            number: user.momo.number,
            network: user.momo.network,
            resolvedName: user.momo.resolvedName,
            isVerified: user.momo.isVerified
          },
          paystack: user.paystack,
          isActive: user.isActive
        },
        token
      }
    });

  } catch (error) {
    console.error('Step 3 error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during payment setup',
      step: 3
    });
  }
};

/**
 * Verify MoMo and create Paystack recipient (for existing users)
 */
const verifyMoMoAndCreateRecipient = async (req, res) => {
  try {
    const userId = req.user.id; // From authenticated token
    const { momoNumber, momoNetwork } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.momo?.isVerified && user.paystack?.recipientCode) {
      return res.status(400).json({
        success: false,
        message: 'MoMo already verified'
      });
    }

    console.log('Verifying MoMo for existing user:', userId);

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 1. Resolve MoMo Name
    const resolve = await paystack.get(`/bank/resolve?account_number=${momoNumber}&bank_code=${momoNetwork.toUpperCase()}`);
    const resolvedName = resolve.data.data.account_name;
    
    console.log('MoMo name resolved:', resolvedName);

    // Add another delay before creating recipient
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Create Transfer Recipient
    const recipient = await paystack.post('/transferrecipient', {
      type: "mobile_money",
      name: resolvedName,
      account_number: momoNumber,
      bank_code: momoNetwork.toUpperCase(),
      currency: "GHS",
      description: `PurWash Payout: ${user.profile.firstName}` 
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H6',
        location: 'backend/controllers/partnerRegistrationController.js:370',
        message: 'verify_momo_recipient_created',
        data: {
          userId,
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

    console.log('Transfer recipient created:', recipient.data.data.recipient_code);

    // Update user with verification
    user.momo = {
      number: momoNumber,
      network: momoNetwork,
      resolvedName: resolvedName,
      isVerified: true
    };
    
    user.paystack = {
      recipientCode: recipient.data.data.recipient_code,
      bankName: momoNetwork.toUpperCase(),
      accountName: resolvedName
    };

    await user.save();

    res.json({
      success: true,
      message: 'MoMo verification completed successfully!',
      data: {
        momo: user.momo,
        paystack: user.paystack
      }
    });

  } catch (error) {
    console.error('MoMo verification error:', error);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification attempts. Please try again in a few minutes.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Verification failed'
    });
  }
};
const getRegistrationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const completeness = user.getProfileCompleteness();
    const missingFields = user.getMissingFields();
    
    // Determine current step based on completed fields
    let currentStep = 1;
    if (user.businessName || user.location.address) {
      currentStep = 2;
    }
    if (user.momo.number || user.profilePicture) {
      currentStep = 3;
    }

    res.json({
      success: true,
      data: {
        currentStep,
        isComplete: completeness === 100,
        completeness,
        missingFields,
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          role: user.role,
          businessName: user.businessName,
          location: user.location,
          bio: user.bio,
          operatingHours: user.operatingHours,
          momo: {
            number: user.momo.number,
            network: user.momo.network,
            resolvedName: user.momo.resolvedName,
            isVerified: user.momo.isVerified
          },
          profilePicture: user.profilePicture
        }
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
  stepOneBasicInfo,
  stepTwoBusinessInfo,
  stepThreePaymentSetup,
  getRegistrationStatus,
  verifyMoMoAndCreateRecipient
};
