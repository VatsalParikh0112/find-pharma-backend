const { validationResult } = require('express-validator');
const SupportTicket = require('../models/SupportTicket');

// POST /api/support  or  /api/pharmacy/support  (protected; account type pinned by route)
const submitTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { subject, message } = req.body;

  try {
    const ticket = await SupportTicket.create({
      requesterType: req.account.accountType,
      requester: req.user._id,
      name: req.user.name,
      email: req.user.email,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Your support request has been submitted. Our team will get back to you by email.',
      ticket,
    });
  } catch (err) {
    console.error('Submit ticket error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitTicket };
