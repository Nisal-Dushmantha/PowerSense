const express = require('express');
const {
  register,
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
  login,
  getMe,
  updateProfile,
  changePassword,
  updateThreshold
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/send-whatsapp-otp
// @desc    Send WhatsApp OTP for registration
// @access  Public
router.post('/send-whatsapp-otp', sendWhatsAppOtp);

// @route   POST /api/auth/verify-whatsapp-otp
// @desc    Verify WhatsApp OTP for registration
// @access  Public
router.post('/verify-whatsapp-otp', verifyWhatsAppOtp);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, changePassword);

// @route   PUT /api/auth/threshold
// @desc    Update energy alert threshold
// @access  Private
router.put('/threshold', protect, updateThreshold);

module.exports = router;
