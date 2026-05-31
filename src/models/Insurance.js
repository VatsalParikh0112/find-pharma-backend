const mongoose = require('mongoose');

/**
 * US Health Insurance Card fields — aligned with what a pharmacist actually needs
 * to process a prescription claim (PBM billing).
 *
 * Critical pharmacy fields: rxBIN, rxPCN, rxGroup
 * These are printed on every US health insurance card under "Rx" or "Prescription".
 */
const insuranceSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Who issued the card ──────────────────────────────────────────────────
    providerName: {
      type: String,
      required: [true, 'Insurance provider name is required'],
      trim: true,
      maxlength: [100, 'Provider name cannot exceed 100 characters'],
    },
    planName: {
      type: String,
      trim: true,
      maxlength: [100, 'Plan name cannot exceed 100 characters'],
    },
    planType: {
      type: String,
      enum: ['PPO', 'HMO', 'EPO', 'HDHP', 'POS', 'Medicare', 'Medicaid', 'Other'],
      default: 'Other',
    },

    // ── Member identification ───────────────────────────────────────────────
    memberId: {
      type: String,
      required: [true, 'Member ID is required'],
      trim: true,
      maxlength: [50, 'Member ID cannot exceed 50 characters'],
    },
    groupNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Group number cannot exceed 50 characters'],
    },
    holderName: {
      type: String,
      required: [true, 'Card holder name is required'],
      trim: true,
      maxlength: [100, 'Holder name cannot exceed 100 characters'],
    },

    // ── Pharmacy / Rx billing fields (PBM) ─────────────────────────────────
    rxBIN: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'RxBIN must be exactly 6 digits'],
    },
    rxPCN: {
      type: String,
      trim: true,
      maxlength: [20, 'RxPCN cannot exceed 20 characters'],
    },
    rxGroup: {
      type: String,
      trim: true,
      maxlength: [20, 'RxGroup cannot exceed 20 characters'],
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Insurance', insuranceSchema);
