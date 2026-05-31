const { validationResult } = require('express-validator');
const MedicineSearch = require('../models/MedicineSearch');

// POST /api/searches (protected)
const saveSearch = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { medicines, location, postalCode, resultsCount } = req.body;

  try {
    const search = await MedicineSearch.create({
      patient: req.user._id,
      medicines,
      location: location?.lat && location?.lng ? location : undefined,
      postalCode: postalCode?.trim() || undefined,
      resultsCount: typeof resultsCount === 'number' ? resultsCount : 0,
    });

    res.status(201).json({ success: true, search });
  } catch (err) {
    console.error('Save search error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/searches/my (protected)
const getMySearchHistory = async (req, res) => {
  try {
    const searches = await MedicineSearch.find({ patient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, searches });
  } catch (err) {
    console.error('Get search history error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { saveSearch, getMySearchHistory };
