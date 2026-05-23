const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../services/email.service');
const { sendOtpSms } = require('../services/sms.service');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const createOtp = async (target, type) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = await bcrypt.hash(code, 10);
  await Otp.deleteMany({ target, type });
  await Otp.create({ target, type, otp: hashed, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  return code;
};

const verifyOtpRecord = async (target, type, code) => {
  const record = await Otp.findOne({ target, type }).sort({ createdAt: -1 });
  if (!record) return { valid: false, message: 'OTP not found. Please request a new one.' };
  if (record.used) return { valid: false, message: 'OTP already used. Please request a new one.' };
  if (record.expiresAt < new Date()) return { valid: false, message: 'OTP has expired. Please request a new one.' };
  const isValid = await bcrypt.compare(code, record.otp);
  if (!isValid) return { valid: false, message: 'Invalid OTP. Please try again.' };
  record.used = true;
  await record.save();
  return { valid: true };
};

// POST /api/auth/send-registration-otp
const sendRegistrationOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, phone } = req.body;

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    const emailCode = await createOtp(email.toLowerCase(), 'email');
    await sendOtpEmail(email, emailCode);

    const phoneCode = await createOtp(phone, 'phone');
    await sendOtpSms(phone, phoneCode);

    res.json({
      success: true,
      message: 'OTP sent to your email and phone',
      phoneSent: true,
    });
  } catch (err) {
    console.error('Send registration OTP error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to send OTPs' });
  }
};

// POST /api/auth/send-otp  (login OTP — email or phone)
const sendOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required' });
  }

  try {
    const user = await User.findOne(email ? { email } : { phone });
    if (!user) {
      return res.status(404).json({ success: false, message: `No account found with this ${email ? 'email' : 'phone number'}` });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    if (email) {
      const code = await createOtp(email.toLowerCase(), 'email');
      await sendOtpEmail(email, code);
      res.json({ success: true, message: 'OTP sent to your email' });
    } else {
      const code = await createOtp(phone, 'phone');
      await sendOtpSms(phone, code);
      res.json({ success: true, message: 'OTP sent to your phone' });
    }
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// POST /api/auth/verify-otp  (login OTP → returns JWT)
const verifyOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, phone, otp } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required' });
  }

  try {
    const target = email ? email.toLowerCase() : phone;
    const type = email ? 'email' : 'phone';

    const result = await verifyOtpRecord(target, type, otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOne(email ? { email } : { phone });
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};

// POST /api/auth/forgot-password (public)
const sendForgotPasswordOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required' });
  }

  try {
    const user = await User.findOne(email ? { email } : { phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No account found with this ${email ? 'email' : 'phone number'}`,
      });
    }

    if (email) {
      const code = await createOtp(email.toLowerCase(), 'email');
      await sendOtpEmail(email, code);
      res.json({ success: true, message: 'OTP sent to your email' });
    } else {
      const code = await createOtp(phone, 'phone');
      await sendOtpSms(phone, code);
      res.json({ success: true, message: 'OTP sent to your phone' });
    }
  } catch (err) {
    console.error('Forgot password OTP error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// POST /api/auth/reset-password (public)
const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, phone, otp, newPassword } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required' });
  }

  try {
    const target = email ? email.toLowerCase() : phone;
    const type = email ? 'email' : 'phone';

    const result = await verifyOtpRecord(target, type, otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOne(email ? { email } : { phone }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/send-change-email-otp (protected)
// Sends OTP to both the current email and the new email
const sendChangeEmailOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { newEmail } = req.body;
  const currentEmail = req.user.email;

  try {
    const existing = await User.findOne({ email: newEmail.toLowerCase(), _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already used by another account' });
    }

    const currentCode = await createOtp(currentEmail.toLowerCase(), 'email');
    await sendOtpEmail(currentEmail, currentCode);

    const newCode = await createOtp(newEmail.toLowerCase(), 'email');
    await sendOtpEmail(newEmail, newCode);

    res.json({ success: true, message: 'OTP sent to your current and new email' });
  } catch (err) {
    console.error('Send change email OTP error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// PUT /api/auth/change-email (protected)
// Verifies OTP from current email AND new email before updating
const changeEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { newEmail, currentOtp, newOtp } = req.body;

  try {
    const existing = await User.findOne({ email: newEmail.toLowerCase(), _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already used by another account' });
    }

    const currentResult = await verifyOtpRecord(req.user.email.toLowerCase(), 'email', currentOtp);
    if (!currentResult.valid) {
      return res.status(400).json({ success: false, message: `Current email OTP: ${currentResult.message}` });
    }

    const newResult = await verifyOtpRecord(newEmail.toLowerCase(), 'email', newOtp);
    if (!newResult.valid) {
      return res.status(400).json({ success: false, message: `New email OTP: ${newResult.message}` });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { email: newEmail.toLowerCase() },
      { new: true, runValidators: true },
    );

    const token = generateToken(user._id);

    res.json({ success: true, message: 'Email updated successfully', token, user });
  } catch (err) {
    console.error('Change email error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/send-change-phone-otp (protected)
// If user already has a phone, sends OTP to both current and new phone.
// If user has no phone yet, sends OTP only to the new phone.
const sendChangePhoneOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { newPhone } = req.body;
  const currentPhone = req.user.phone;

  try {
    const existing = await User.findOne({ phone: newPhone, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone already used by another account' });
    }

    if (currentPhone) {
      const currentCode = await createOtp(currentPhone, 'phone');
      await sendOtpSms(currentPhone, currentCode);
    }

    const newCode = await createOtp(newPhone, 'phone');
    await sendOtpSms(newPhone, newCode);

    res.json({
      success: true,
      message: currentPhone ? 'OTP sent to your current and new phone number' : 'OTP sent to your new phone number',
    });
  } catch (err) {
    console.error('Send change phone OTP error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// PUT /api/auth/change-phone (protected)
// If user has a current phone, verifies OTP from both. Otherwise verifies only the new phone OTP.
const changePhone = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { newPhone, currentOtp, newOtp } = req.body;
  const currentPhone = req.user.phone;

  try {
    const existing = await User.findOne({ phone: newPhone, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone already used by another account' });
    }

    if (currentPhone) {
      const currentResult = await verifyOtpRecord(currentPhone, 'phone', currentOtp);
      if (!currentResult.valid) {
        return res.status(400).json({ success: false, message: `Current phone OTP: ${currentResult.message}` });
      }
    }

    const newResult = await verifyOtpRecord(newPhone, 'phone', newOtp);
    if (!newResult.valid) {
      return res.status(400).json({ success: false, message: `New phone OTP: ${newResult.message}` });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { phone: newPhone },
      { new: true, runValidators: true },
    );

    const token = generateToken(user._id);

    res.json({ success: true, message: 'Phone number updated successfully', token, user });
  } catch (err) {
    console.error('Change phone error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  sendRegistrationOtp,
  sendOtp,
  verifyOtp,
  verifyOtpRecord,
  sendForgotPasswordOtp,
  resetPassword,
  sendChangeEmailOtp,
  changeEmail,
  sendChangePhoneOtp,
  changePhone,
};
