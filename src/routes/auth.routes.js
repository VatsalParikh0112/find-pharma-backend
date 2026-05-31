const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, changePassword, logout } = require('../controllers/auth.controller');
const {
  sendRegistrationOtp,
  sendOtp,
  verifyOtp,
  sendForgotPasswordOtp,
  resetPassword,
  sendChangeEmailOtp,
  changeEmail,
  sendChangePhoneOtp,
  changePhone,
} = require('../controllers/otp.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const otpRule = body('emailOtp').matches(/^\d{6}$/).withMessage('Email OTP must be 6 digits');
const phoneOtpRule = body('phoneOtp').matches(/^\d{6}$/).withMessage('Phone OTP must be 6 digits');
const otpBodyRule = body('otp').matches(/^\d{6}$/).withMessage('OTP must be a 6-digit number');
const phoneRule = body('phone')
  .notEmpty().withMessage('Phone number is required')
  .matches(/^\+[1-9]\d{6,14}$/)
  .withMessage('Please enter a valid international phone number (e.g. +12025551234)');

// ─── Public ──────────────────────────────────────────────────────────────────

router.post(
  '/send-registration-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    phoneRule,
  ],
  sendRegistrationOtp,
);

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    phoneRule,
    otpRule,
    phoneOtpRule,
  ],
  register,
);

router.post(
  '/login',
  [
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).matches(/^\+[1-9]\d{6,14}$/).withMessage('Please enter a valid phone number'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login,
);

router.post(
  '/send-otp',
  [
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).matches(/^\+[1-9]\d{6,14}$/).withMessage('Please enter a valid phone number'),
  ],
  sendOtp,
);

router.post(
  '/verify-otp',
  [
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).matches(/^\+[1-9]\d{6,14}$/).withMessage('Please enter a valid phone number'),
    otpBodyRule,
  ],
  verifyOtp,
);

router.post(
  '/forgot-password',
  [
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).matches(/^\+[1-9]\d{6,14}$/).withMessage('Please enter a valid phone number'),
  ],
  sendForgotPasswordOtp,
);

router.post(
  '/reset-password',
  [
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).matches(/^\+[1-9]\d{6,14}$/).withMessage('Please enter a valid phone number'),
    otpBodyRule,
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  resetPassword,
);

router.post('/logout', logout);

// ─── Protected ───────────────────────────────────────────────────────────────

router.get('/me', protect, getMe);

router.put(
  '/profile',
  protect,
  [body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters')],
  updateProfile,
);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  changePassword,
);

router.post(
  '/send-change-email-otp',
  protect,
  [body('newEmail').isEmail().withMessage('Please enter a valid email').normalizeEmail()],
  sendChangeEmailOtp,
);

router.put(
  '/change-email',
  protect,
  [
    body('newEmail').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('currentOtp').matches(/^\d{6}$/).withMessage('Current email OTP must be 6 digits'),
    body('newOtp').matches(/^\d{6}$/).withMessage('New email OTP must be 6 digits'),
  ],
  changeEmail,
);

router.post(
  '/send-change-phone-otp',
  protect,
  [
    body('newPhone')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\+[1-9]\d{6,14}$/)
      .withMessage('Please enter a valid international phone number (e.g. +12025551234)'),
  ],
  sendChangePhoneOtp,
);

router.put(
  '/change-phone',
  protect,
  [
    body('newPhone')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\+[1-9]\d{6,14}$/)
      .withMessage('Please enter a valid international phone number (e.g. +12025551234)'),
    body('currentOtp').optional({ checkFalsy: true }).matches(/^\d{6}$/).withMessage('Current phone OTP must be 6 digits'),
    body('newOtp').matches(/^\d{6}$/).withMessage('New phone OTP must be 6 digits'),
  ],
  changePhone,
);

module.exports = router;
