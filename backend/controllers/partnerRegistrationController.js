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

    // Update payment information with Paystack verification
    let moMoVerificationSuccess = false;
    try {
      console.log('Starting Paystack verification for:', momoNumber, momoNetwork);
      
      // 1. Resolve MoMo Name (Verification)
      const resolve = await paystack.get(`/bank/resolve?account_number=${momoNumber}&bank_code=${momoNetwork.toUpperCase()}`);
      const resolvedName = resolve.data.data.account_name;
      console.log('MoMo resolved successfully:', resolvedName);

      // 2. Create Paystack Subaccount
      const subaccount = await paystack.post('/subaccount', {
        business_name: user.businessName || user.profile.firstName,
        settlement_bank: momoNetwork.toUpperCase(),
        account_number: momoNumber,
        percentage_charge: 0,
        description: `PurWash ${user.role}: ${user.profile.firstName} ${user.profile.lastName}`
      });
      console.log('Subaccount created successfully');

      // 3. Create Transfer Recipient (For payouts)
      const recipient = await paystack.post('/transferrecipient', {
        type: "mobile_money",
        name: resolvedName,
        account_number: momoNumber,
        bank_code: momoNetwork.toUpperCase(),
        currency: "GHS"
      });
      console.log('Transfer recipient created successfully');

      // Update user with verified MoMo info
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

      moMoVerificationSuccess = true;
      console.log('Paystack verification completed successfully');

    } catch (error) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      
      // If Paystack verification fails, still save the info but mark as unverified
      user.momo = {
        number: momoNumber,
        network: momoNetwork,
        resolvedName: '',
        isVerified: false
      };
      
      // Don't fail the entire registration if Paystack fails
      console.log('Registration continuing without Paystack verification');
    }
    user.profilePicture = profilePicture || '';

    // Add rider-specific emergency contact
    if (user.role === 'rider' && emergencyContact) {
      user.emergencyContact = {
        name: emergencyContact.name || '',
        phone: emergencyContact.phone || '',
        relationship: emergencyContact.relationship || ''
      };
    }

    await user.save();

    // Generate final token
    const finalToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // Get profile completeness
    const completeness = user.getProfileCompleteness();
    const missingFields = user.getMissingFields();

    // Create success message based on MoMo verification
    const successMessage = moMoVerificationSuccess 
      ? `Registration completed successfully! MoMo account verified for ${user.momo.resolvedName}`
      : 'Registration completed successfully! MoMo verification pending - you can complete this later';

    res.json({
      success: true,
      message: successMessage,
      step: 3,
      isComplete: true,
      data: {
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
          profilePicture: user.profilePicture,
          ...(user.role === 'rider' && {
            vehicleType: user.vehicleType,
            vehicleNumber: user.vehicleNumber,
            emergencyContact: user.emergencyContact
          })
        },
        token: finalToken,
        profileCompleteness: {
          completeness,
          missingFields,
          isComplete: completeness === 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      step: 3
    });
  }
};

/**
 * Get current registration status
 */
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
  getRegistrationStatus
};
