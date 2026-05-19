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
  console.log('[verifyOtpRecord] Querying:', { target, type });
  const record = await Otp.findOne({ target, type }).sort({ createdAt: -1 });
  console.log('[verifyOtpRecord] Record found:', record ? { target: record.target, type: record.type, used: record.used, expiresAt: record.expiresAt } : null);
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
    // Check email uniqueness
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Check phone uniqueness
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    // Send email OTP
    const emailCode = await createOtp(email.toLowerCase(), 'email');
    await sendOtpEmail(email, emailCode);

    // Send phone OTP
    const phoneCode = await createOtp(phone, 'phone');
    await sendOtpSms(phone, phoneCode);

    res.json({
      success: true,
      message: 'OTP sent to your email and phone',
      phoneSent: true,
    });
  } catch (err) {
    console.error('Send registration OTP error:', err);
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
      const target = email.toLowerCase();
      console.log('[sendOtp] Creating OTP with target:', target);
      const code = await createOtp(target, 'email');
      await sendOtpEmail(email, code);
      res.json({ success: true, message: 'OTP sent to your email' });
    } else {
      console.log('[sendOtp] Creating OTP with target:', phone);
      const code = await createOtp(phone, 'phone');
      await sendOtpSms(phone, code);
      res.json({ success: true, message: 'OTP sent to your phone' });
    }
  } catch (err) {
    console.error('Send OTP error:', err);
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
  console.log('[verifyOtp] Request body:', { email, phone, otp });

  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required' });
  }

  try {
    const target = email ? email.toLowerCase() : phone;
    const type = email ? 'email' : 'phone';
    console.log('[verifyOtp] Verifying:', { target, type });

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
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};

module.exports = { sendRegistrationOtp, sendOtp, verifyOtp, verifyOtpRecord };
