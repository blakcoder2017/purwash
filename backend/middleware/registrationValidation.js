/**
 * Validation middleware for multi-step partner registration
 */

const validateStepOne = (req, res, next) => {
  const { email, password, firstName, lastName, phone, role } = req.body;
  
  const errors = [];
  
  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  
  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  // Name validation
  if (!firstName || firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  }
  
  if (!lastName || lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  }
  
  // Phone validation
  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^[0-9]{8,15}$/.test(phone.replace(/[\s-]/g, ''))) {
    errors.push('Valid phone number is required');
  }
  
  // Role validation
  if (!role || !['rider', 'partner'].includes(role)) {
    errors.push('Role must be either rider or partner');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      step: 1
    });
  }
  
  next();
};

const validateStepTwo = (req, res, next) => {
  const { businessName, address, bio, operatingHours } = req.body;
  
  const errors = [];
  
  // Business name validation
  if (!businessName || businessName.trim().length < 2) {
    errors.push('Business name must be at least 2 characters');
  }
  
  // Address validation
  if (!address || address.trim().length < 5) {
    errors.push('Address must be at least 5 characters');
  }
  
  // Bio validation (optional but recommended)
  if (bio && bio.length > 500) {
    errors.push('Bio must be less than 500 characters');
  }
  
  // Operating hours validation
  if (operatingHours) {
    const { open, close } = operatingHours;
    
    if (open && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(open)) {
      errors.push('Opening time must be in HH:MM format');
    }
    
    if (close && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(close)) {
      errors.push('Closing time must be in HH:MM format');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      step: 2
    });
  }
  
  next();
};

const validateStepThree = (req, res, next) => {
  const { momoNumber, momoNetwork, profilePicture } = req.body;
  
  const errors = [];
  
  // MoMo number validation
  if (!momoNumber) {
    errors.push('MoMo number is required');
  } else if (!/^[0-9]{10}$/.test(momoNumber.replace(/[\s-]/g, ''))) {
    errors.push('Valid MoMo number is required (10 digits)');
  }
  
  // MoMo network validation
  if (!momoNetwork) {
    errors.push('MoMo network is required');
  } else if (!['mtn', 'vod', 'atl'].includes(momoNetwork.toLowerCase())) {
    errors.push('MoMo network must be MTN, VOD, or ATL');
  }
  
  // Profile picture validation (optional)
  if (profilePicture && typeof profilePicture !== 'string') {
    errors.push('Profile picture must be a valid URL string');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
      step: 3
    });
  }
  
  next();
};

module.exports = {
  validateStepOne,
  validateStepTwo,
  validateStepThree
};
