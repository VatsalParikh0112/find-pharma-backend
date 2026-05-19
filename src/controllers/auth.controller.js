const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyOtpRecord } = require('./otp.controller');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, phone, emailOtp, phoneOtp } = req.body;
  console.log('[Register] Attempt:', { email, phone: phone || 'none', hasEmailOtp: !!emailOtp, hasPhoneOtp: !!phoneOtp });

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const emailResult = await verifyOtpRecord(email.toLowerCase(), 'email', emailOtp);
    console.log('[Register] Email OTP result:', emailResult);
    if (!emailResult.valid) {
      return res.status(400).json({ success: false, message: emailResult.message });
    }

    if (phone) {
      const phoneResult = await verifyOtpRecord(phone, 'phone', phoneOtp);
      console.log('[Register] Phone OTP result:', phoneResult);
      if (!phoneResult.valid) {
        return res.status(400).json({ success: false, message: `Phone OTP: ${phoneResult.message}` });
      }
    }

    const user = await User.create({ name, email, password, ...(phone && { phone }) });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };
