const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Pharmacy accounts live in their own collection, completely separate from
// patient `User` accounts. A patient can never authenticate against this
// collection and a pharmacy can never authenticate against `User`.
const pharmacyUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['pharmacy', 'admin'],
      default: 'pharmacy',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+[1-9]\d{6,14}$/, 'Please enter a valid international phone number'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

pharmacyUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

pharmacyUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

pharmacyUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('PharmacyUser', pharmacyUserSchema);
