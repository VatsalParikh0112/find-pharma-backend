const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyOtpRecord } = require('./otp.controller');
const { setAuthCookie, clearAuthCookie } = require('../utils/cookie');

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

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({ success: false, message: 'Phone number already registered' });
      }
    }

    const emailResult = await verifyOtpRecord(email.toLowerCase(), 'email', emailOtp);
    if (!emailResult.valid) {
      return res.status(400).json({ success: false, message: emailResult.message });
    }

    const phoneResult = await verifyOtpRecord(phone, 'phone', phoneOtp);
    if (!phoneResult.valid) {
      return res.status(400).json({ success: false, message: `Phone OTP: ${phoneResult.message}` });
    }

    const user = await User.create({ name, email, password, phone });
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required' });
  }

  try {
    const user = await User.findOne(email ? { email } : { phone }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: `Invalid ${email ? 'email' : 'phone'} or password` });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/profile (protected)
const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true },
    );

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.json({ success: true, message: 'Profile updated successfully', token, user });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/auth/change-password (protected)
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, login, getMe, updateProfile, changePassword, logout };
