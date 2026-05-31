const { validationResult } = require('express-validator');
const MedicineRequest = require('../models/MedicineRequest');
const Pharmacy = require('../models/Pharmacy');
const Insurance = require('../models/Insurance');

// POST /api/requests (protected)
const createRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { pharmacyId, medicineName, quantity, notes, insuranceId } = req.body;

  try {
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy || !pharmacy.isActive) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    const existing = await MedicineRequest.findOne({
      patient: req.user._id,
      pharmacy: pharmacyId,
      medicineName: { $regex: new RegExp(`^${medicineName.trim()}$`, 'i') },
      status: 'pending',
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending request for this medicine at this pharmacy',
      });
    }

    // Validate insurance if provided
    if (insuranceId) {
      const insurance = await Insurance.findOne({ _id: insuranceId, patient: req.user._id });
      if (!insurance) {
        return res.status(404).json({ success: false, message: 'Insurance not found' });
      }
    }

    const request = await MedicineRequest.create({
      patient: req.user._id,
      pharmacy: pharmacyId,
      medicineName: medicineName.trim(),
      quantity: quantity?.trim() || undefined,
      notes: notes?.trim() || undefined,
      insurance: insuranceId || null,
    });

    const populated = await request.populate([
      { path: 'pharmacy', select: 'name address phone' },
      { path: 'insurance', select: 'providerName policyNumber planName holderName' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Request sent successfully',
      request: populated,
    });
  } catch (err) {
    console.error('Create request error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/requests/my (protected)
const getMyRequests = async (req, res) => {
  try {
    const requests = await MedicineRequest.find({ patient: req.user._id })
      .populate('pharmacy', 'name address phone')
      .populate('insurance', 'providerName policyNumber planName holderName')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    console.error('Get my requests error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/requests/my/active (protected)
const getMyActiveRequests = async (req, res) => {
  try {
    const requests = await MedicineRequest.find({
      patient: req.user._id,
      status: { $in: ['pending', 'accepted'] },
    })
      .populate('pharmacy', 'name address phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    console.error('Get active requests error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/requests/:id (protected)
const cancelRequest = async (req, res) => {
  try {
    const request = await MedicineRequest.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled',
      });
    }

    await request.deleteOne();

    res.json({ success: true, message: 'Request cancelled successfully' });
  } catch (err) {
    console.error('Cancel request error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/requests/pharmacy/:pharmacyId (protected — any authenticated user can view a pharmacy's requests)
const getPharmacyRequests = async (req, res) => {
  try {
    const requests = await MedicineRequest.find({ pharmacy: req.params.pharmacyId })
      .populate('patient', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    console.error('Get pharmacy requests error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createRequest, getMyRequests, getMyActiveRequests, cancelRequest, getPharmacyRequests };
