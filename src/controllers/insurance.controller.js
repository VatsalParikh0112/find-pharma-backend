const { validationResult } = require('express-validator');
const Insurance = require('../models/Insurance');

// POST /api/insurance
const createInsurance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const {
    providerName,
    planName,
    planType,
    memberId,
    groupNumber,
    holderName,
    rxBIN,
    rxPCN,
    rxGroup,
    isDefault,
  } = req.body;

  try {
    const count = await Insurance.countDocuments({ patient: req.user._id });
    if (count >= 3) {
      return res
        .status(400)
        .json({ success: false, message: 'You can save a maximum of 3 insurance cards.' });
    }

    if (isDefault) {
      await Insurance.updateMany({ patient: req.user._id }, { isDefault: false });
    }

    const insurance = await Insurance.create({
      patient: req.user._id,
      providerName: providerName.trim(),
      planName: planName?.trim() || undefined,
      planType: planType || 'Other',
      memberId: memberId.trim(),
      groupNumber: groupNumber?.trim() || undefined,
      holderName: holderName.trim(),
      rxBIN: rxBIN?.trim() || undefined,
      rxPCN: rxPCN?.trim() || undefined,
      rxGroup: rxGroup?.trim() || undefined,
      isDefault: !!isDefault,
    });

    res.status(201).json({ success: true, insurance });
  } catch (err) {
    console.error('Create insurance error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/insurance
const getMyInsurances = async (req, res) => {
  try {
    const insurances = await Insurance.find({ patient: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json({ success: true, insurances });
  } catch (err) {
    console.error('Get insurances error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/insurance/:id
const updateInsurance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const insurance = await Insurance.findOne({ _id: req.params.id, patient: req.user._id });
    if (!insurance) return res.status(404).json({ success: false, message: 'Insurance not found' });

    const {
      providerName,
      planName,
      planType,
      memberId,
      groupNumber,
      holderName,
      rxBIN,
      rxPCN,
      rxGroup,
      isDefault,
    } = req.body;

    if (isDefault) {
      await Insurance.updateMany(
        { patient: req.user._id, _id: { $ne: req.params.id } },
        { isDefault: false },
      );
    }

    Object.assign(insurance, {
      providerName: providerName?.trim() ?? insurance.providerName,
      planName: planName?.trim() || undefined,
      planType: planType || insurance.planType,
      memberId: memberId?.trim() ?? insurance.memberId,
      groupNumber: groupNumber?.trim() || undefined,
      holderName: holderName?.trim() ?? insurance.holderName,
      rxBIN: rxBIN?.trim() || undefined,
      rxPCN: rxPCN?.trim() || undefined,
      rxGroup: rxGroup?.trim() || undefined,
      isDefault: isDefault !== undefined ? !!isDefault : insurance.isDefault,
    });

    await insurance.save();
    res.json({ success: true, insurance });
  } catch (err) {
    console.error('Update insurance error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/insurance/:id
const deleteInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findOneAndDelete({
      _id: req.params.id,
      patient: req.user._id,
    });
    if (!insurance) return res.status(404).json({ success: false, message: 'Insurance not found' });

    res.json({ success: true, message: 'Insurance card deleted' });
  } catch (err) {
    console.error('Delete insurance error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/insurance/:id/set-default
const setDefault = async (req, res) => {
  try {
    const insurance = await Insurance.findOne({ _id: req.params.id, patient: req.user._id });
    if (!insurance) return res.status(404).json({ success: false, message: 'Insurance not found' });

    await Insurance.updateMany({ patient: req.user._id }, { isDefault: false });
    insurance.isDefault = true;
    await insurance.save();

    res.json({ success: true, insurance });
  } catch (err) {
    console.error('Set default insurance error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createInsurance, getMyInsurances, updateInsurance, deleteInsurance, setDefault };
