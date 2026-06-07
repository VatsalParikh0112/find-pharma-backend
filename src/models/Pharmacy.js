const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema(
  {
    // The pharmacy account that owns/manages this listing. One listing per owner.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PharmacyUser',
      unique: true,
      sparse: true,
    },
    // Admin verification gate. A pharmacy is only shown to patients and only
    // granted portal access once an admin approves it.
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, trim: true },
    // Real-pharmacy credentials.
    npiNumber: { type: String, trim: true }, // 10-digit National Provider Identifier
    npiVerified: { type: Boolean, default: false }, // matched against the NPPES registry
    npiRegistryName: { type: String, trim: true }, // legal name returned by NPPES
    stateLicenseNumber: { type: String, trim: true },
    licenseState: { type: String, trim: true },
    name: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
    },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    openingHours: { type: String, trim: true },
    // Billing / account status. Everything is free for now (plan='free'), but an
    // admin can warn and ultimately disable a pharmacy that doesn't pay later.
    plan: { type: String, default: 'free' },
    accountStatus: {
      type: String,
      enum: ['active', 'warned', 'disabled'],
      default: 'active',
    },
    warnings: [
      {
        message: { type: String, trim: true },
        at: { type: Date, default: Date.now },
      },
    ],
    disabledReason: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

pharmacySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
