const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/auth.controller');
const { sendRegistrationOtp, sendOtp, verifyOtp } = require('../controllers/otp.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const otpRule = body('emailOtp').matches(/^\d{6}$/).withMessage('Email OTP must be 6 digits');
const phoneOtpRule = body('phoneOtp')
  .if(body('phone').exists({ checkFalsy: true }))
  .matches(/^\d{6}$/)
  .withMessage('Phone OTP must be 6 digits');

router.post(
  '/send-registration-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('phone')
      .optional({ checkFalsy: true })
      .matches(/^\+[1-9]\d{6,14}$/)
      .withMessage('Please enter a valid international phone number (e.g. +12025551234)'),
  ],
  sendRegistrationOtp
);

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone')
      .optional({ checkFalsy: true })
      .matches(/^\+[1-9]\d{6,14}$/)
      .withMessage('Please enter a valid international phone number (e.g. +12025551234)'),
    otpRule,
    phoneOtpRule,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post(
  '/send-otp',
  [body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail()],
  sendOtp
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('otp').matches(/^\d{6}$/).withMessage('OTP must be a 6-digit number'),
  ],
  verifyOtp
);

router.get('/me', protect, getMe);

module.exports = router;
