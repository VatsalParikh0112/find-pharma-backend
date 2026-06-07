const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Pharmacy = require('../models/Pharmacy');
const SupportTicket = require('../models/SupportTicket');
const { generateToken } = require('../utils/account');
const {
  sendPharmacyStatusEmail,
  sendPharmacyAccountEmail,
  sendSupportReplyEmail,
} = require('../services/email.service');

// Best-effort email — never fail the request if the mail send fails.
const tryEmail = async fn => {
  try {
    await fn();
  } catch (err) {
    console.error('Admin email failed:', err.message);
  }
};

// POST /api/admin/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  // Bootstrap admin: the very first login with the configured credentials
  // creates the admin automatically, so the portal works even if the seed
  // script was never run.
  const bootstrapEmail = (process.env.ADMIN_LOGIN_EMAIL || 'admin@findmypharma.com').toLowerCase();
  const bootstrapPassword = process.env.ADMIN_LOGIN_PASSWORD || 'admin12345';

  try {
    let admin = await Admin.findOne({ email }).select('+password');

    if (!admin && email === bootstrapEmail && password === bootstrapPassword) {
      admin = await Admin.create({ email: bootstrapEmail, password: bootstrapPassword, name: 'Admin' });
    }

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Bearer token (no cookie) — the admin frontend stores and sends it.
    const token = generateToken(admin._id, 'admin');
    res.json({ success: true, token, admin: { _id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/pharmacies?status=pending
const getPharmacies = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { verificationStatus: status } : {};
    const pharmacies = await Pharmacy.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, pharmacies });
  } catch (err) {
    console.error('Admin get pharmacies error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/pharmacies/:id/status   body: { status: 'approved'|'rejected', reason? }
const setPharmacyStatus = async (req, res) => {
  const { status, reason } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    pharmacy.verificationStatus = status;
    pharmacy.isActive = status === 'approved';
    pharmacy.rejectionReason = status === 'rejected' ? reason : undefined;
    await pharmacy.save();

    if (pharmacy.email) {
      try {
        await sendPharmacyStatusEmail(pharmacy.email, {
          pharmacyName: pharmacy.name,
          status,
          reason,
        });
      } catch (mailErr) {
        console.error('Pharmacy status email failed:', mailErr.message);
      }
    }

    res.json({ success: true, message: `Pharmacy ${status}`, pharmacy });
  } catch (err) {
    console.error('Admin set status error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/pharmacies/:id/warn   body: { message }
const warnPharmacy = async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Warning message is required' });
  }

  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    pharmacy.warnings.push({ message: message.trim() });
    pharmacy.accountStatus = 'warned';
    await pharmacy.save();

    if (pharmacy.email) {
      await tryEmail(() =>
        sendPharmacyAccountEmail(pharmacy.email, {
          pharmacyName: pharmacy.name,
          kind: 'warned',
          reason: message.trim(),
        }),
      );
    }

    res.json({ success: true, message: 'Warning sent', pharmacy });
  } catch (err) {
    console.error('Warn pharmacy error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/pharmacies/:id/account   body: { status: 'active'|'disabled', reason? }
const setAccountStatus = async (req, res) => {
  const { status, reason } = req.body;
  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    const disabling = status === 'disabled';
    pharmacy.accountStatus = status;
    pharmacy.disabledReason = disabling ? reason : undefined;
    // A disabled pharmacy is hidden from patients; reactivating restores it
    // (only if it was already verified/approved).
    pharmacy.isActive = disabling ? false : pharmacy.verificationStatus === 'approved';
    await pharmacy.save();

    if (pharmacy.email) {
      await tryEmail(() =>
        sendPharmacyAccountEmail(pharmacy.email, {
          pharmacyName: pharmacy.name,
          kind: disabling ? 'disabled' : 'reactivated',
          reason,
        }),
      );
    }

    res.json({ success: true, message: `Pharmacy ${disabling ? 'disabled' : 'reactivated'}`, pharmacy });
  } catch (err) {
    console.error('Set account status error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/support?status=open
const getTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    console.error('Get tickets error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/support/:id   body: { status?, response? }
const updateTicket = async (req, res) => {
  const { status, response } = req.body;

  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
      ticket.status = status;
    }

    if (response && response.trim()) {
      ticket.adminResponse = response.trim();
      if (ticket.email) {
        await tryEmail(() =>
          sendSupportReplyEmail(ticket.email, {
            name: ticket.name,
            subject: ticket.subject,
            response: response.trim(),
          }),
        );
      }
    }

    await ticket.save();
    res.json({ success: true, message: 'Ticket updated', ticket });
  } catch (err) {
    console.error('Update ticket error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [pendingVerifications, openTickets, disabledPharmacies, totalPharmacies] =
      await Promise.all([
        Pharmacy.countDocuments({ verificationStatus: 'pending' }),
        SupportTicket.countDocuments({ status: 'open' }),
        Pharmacy.countDocuments({ accountStatus: 'disabled' }),
        Pharmacy.countDocuments({}),
      ]);
    res.json({
      success: true,
      stats: { pendingVerifications, openTickets, disabledPharmacies, totalPharmacies },
    });
  } catch (err) {
    console.error('Get stats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  login,
  getPharmacies,
  setPharmacyStatus,
  warnPharmacy,
  setAccountStatus,
  getTickets,
  updateTicket,
  getStats,
};
