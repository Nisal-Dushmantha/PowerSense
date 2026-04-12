const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  initializeWhatsAppClient,
  getWhatsAppOtpStatus,
  getWhatsAppOtpQrDataUrl,
  sendOtp,
  verifyOtp,
  normalizePhoneNumber,
  validatePhoneNumber,
  isPhoneVerified,
  consumePhoneVerification,
  isWhatsAppOtpEnabled
} = require('../services/whatsappOtpService');

// JWT secret must come from environment
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = '7d'; // Token expires in 7 days
 
// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number is required'
      });
    }

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.message
      });
    }

    const normalizedPhone = phoneValidation.normalized;

    if (!isPhoneVerified(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your WhatsApp number with OTP before registering'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      contactNumber: normalizedPhone,
      password,
      phoneNumber: normalizedPhone,
      role: role || 'user' // Default to 'user' if not specified
    });

    await user.save();
    consumePhoneVerification(normalizedPhone);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          contactNumber: user.contactNumber,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Send WhatsApp OTP for registration
// @route   POST /api/auth/send-whatsapp-otp
// @access  Public
const sendWhatsAppOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumber is required'
      });
    }

    if (!isWhatsAppOtpEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'WhatsApp OTP is disabled on server'
      });
    }

    const result = await sendOtp(phoneNumber);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }

    return res.json({
      success: true,
      message: result.message,
      data: {
        phoneNumber: result.normalized
      }
    });
  } catch (error) {
    console.error('Send WhatsApp OTP error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

// @desc    Verify WhatsApp OTP for registration
// @route   POST /api/auth/verify-whatsapp-otp
// @access  Public
const verifyWhatsAppOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const result = verifyOtp(phoneNumber, otp);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }

    return res.json({
      success: true,
      message: result.message,
      data: {
        phoneNumber: normalizePhoneNumber(phoneNumber)
      }
    });
  } catch (error) {
    console.error('Verify WhatsApp OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

const startWhatsAppOtpClient = async (req, res) => {
  try {
    if (!isWhatsAppOtpEnabled()) {
      return res.status(503).json({ success: false, message: 'WhatsApp OTP is disabled on server' });
    }

    await initializeWhatsAppClient();
    return res.status(200).json({
      success: true,
      message: 'WhatsApp OTP startup triggered',
      data: getWhatsAppOtpStatus()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to start WhatsApp OTP client' });
  }
};

const getWhatsAppOtpStatusController = (req, res) => {
  try {
    initializeWhatsAppClient();
    return res.status(200).json({ success: true, data: getWhatsAppOtpStatus() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to get WhatsApp OTP status' });
  }
};

const getWhatsAppOtpQrController = async (req, res) => {
  try {
    initializeWhatsAppClient();
    const qrDataUrl = await getWhatsAppOtpQrDataUrl();

    if (!qrDataUrl) {
      return res.status(404).json({ success: false, message: 'QR not available yet. Call /api/auth/whatsapp/start and wait a few seconds.' });
    }

    return res.status(200).json({ success: true, data: { qrDataUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to get WhatsApp OTP QR' });
  }
};

const getWhatsAppOtpQrView = async (req, res) => {
  try {
    initializeWhatsAppClient();
    const status = getWhatsAppOtpStatus();
    const qrDataUrl = await getWhatsAppOtpQrDataUrl();

    if (!status.enabled) {
      return res.status(200).send('<!doctype html><html><head><meta charset="utf-8"/><title>PowerSense OTP WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense OTP WhatsApp QR</h2><p>OTP WhatsApp is disabled. Set <strong>WHATSAPP_WEB_ENABLED=true</strong>.</p></body></html>');
    }

    if (!qrDataUrl) {
      return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="5"/><title>PowerSense OTP WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense OTP WhatsApp QR</h2><p>QR not ready yet. Refreshing every 5 seconds...</p><p>Status: ${status.message || 'Waiting for OTP client'}</p></body></html>`);
    }

    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"/><title>PowerSense OTP WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense OTP WhatsApp QR</h2><p>Scan with WhatsApp → Linked Devices → Link a Device.</p><img src="${qrDataUrl}" alt="OTP WhatsApp QR" style="width:360px;height:360px;border:1px solid #ddd;border-radius:8px;"/></body></html>`);
  } catch (error) {
    return res.status(500).send(`<!doctype html><html><head><meta charset="utf-8"/><title>PowerSense OTP WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense OTP WhatsApp QR</h2><p>Failed to render QR page: ${error.message || 'Unknown error'}</p></body></html>`);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

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
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          contactNumber: user.contactNumber,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    // Update fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
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
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update energy alert threshold
// @route   PUT /api/auth/threshold
// @access  Private
const updateThreshold = async (req, res) => {
  try {
    const { energyThreshold } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { energyThreshold: energyThreshold === '' || energyThreshold === null ? null : parseFloat(energyThreshold) },
      { new: true, runValidators: true }
    );
    res.json({
      success: true,
      message: 'Energy threshold updated',
      data: { energyThreshold: user.energyThreshold }
    });
  } catch (error) {
    console.error('Update threshold error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  startWhatsAppOtpClient,
  getWhatsAppOtpStatusController,
  getWhatsAppOtpQrController,
  getWhatsAppOtpQrView,
  login,
  getMe,
  updateProfile,
  changePassword,
  updateThreshold
};
