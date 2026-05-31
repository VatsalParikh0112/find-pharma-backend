const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ── Basic health info ──────────────────────────────────────────────────
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    },
    heightFt: { type: Number, min: 0 }, // feet
    heightIn: { type: Number, min: 0, max: 11 }, // inches
    weightLbs: { type: Number, min: 0 }, // pounds (US)

    // ── Medical conditions ─────────────────────────────────────────────────
    conditions: [
      {
        name: { type: String, required: true, trim: true, maxlength: 100 },
      },
    ],

    // ── Allergies ──────────────────────────────────────────────────────────
    allergies: [
      {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        type: {
          type: String,
          enum: ['Drug', 'Food', 'Environmental', 'Other'],
          default: 'Other',
        },
      },
    ],

    // ── Current medications ────────────────────────────────────────────────
    medications: [
      {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        dosage: { type: String, trim: true, maxlength: 50 },
        frequency: { type: String, trim: true, maxlength: 50 },
      },
    ],

    // ── Emergency contact ─────────────────────────────────────────────────
    emergencyContact: {
      name: { type: String, trim: true, maxlength: 100 },
      phone: {
        type: String,
        trim: true,
        match: [/^\+[1-9]\d{6,14}$/, 'Please enter a valid international phone number'],
      },
      relationship: { type: String, trim: true, maxlength: 50 },
    },

    // ── Primary care physician ─────────────────────────────────────────────
    primaryPhysician: {
      name: { type: String, trim: true, maxlength: 100 },
      clinic: { type: String, trim: true, maxlength: 100 },
      phone: { type: String, trim: true, maxlength: 20 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
