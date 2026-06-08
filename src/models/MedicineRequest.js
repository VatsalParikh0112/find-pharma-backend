const mongoose = require('mongoose');

const medicineRequestSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    quantity: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    insurance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insurance',
      default: null,
    },
    status: {
      type: String,
      // pending = under review, accepted = approved/awaiting collection,
      // fulfilled = collected, rejected = declined or auto-cancelled.
      enum: ['pending', 'accepted', 'rejected', 'fulfilled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
    },
    pharmacyNotes: { type: String, trim: true, maxlength: 500 },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    acceptedAt: { type: Date },
    collectedAt: { type: Date },
    // True when the system auto-cancelled it (stale pending or uncollected).
    autoCancelled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('MedicineRequest', medicineRequestSchema);
