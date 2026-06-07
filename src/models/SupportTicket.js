const mongoose = require('mongoose');

// A support request raised by a patient or a pharmacy. Managed by admins.
const supportTicketSchema = new mongoose.Schema(
  {
    requesterType: { type: String, enum: ['patient', 'pharmacy'], required: true },
    requester: { type: mongoose.Schema.Types.ObjectId }, // User or PharmacyUser id
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
    adminResponse: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
