const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  target: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['email', 'phone'],
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ target: 1, type: 1 });

module.exports = mongoose.model('Otp', otpSchema);
