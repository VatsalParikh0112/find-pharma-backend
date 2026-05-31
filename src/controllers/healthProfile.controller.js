const HealthProfile = require('../models/HealthProfile');

// GET /api/health-profile
const getHealthProfile = async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ patient: req.user._id });
    res.json({ success: true, profile: profile || null });
  } catch (err) {
    console.error('Get health profile error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/health-profile  (upsert)
const saveHealthProfile = async (req, res) => {
  try {
    const {
      dateOfBirth, gender, bloodType, heightFt, heightIn, weightLbs,
      conditions, allergies, medications, emergencyContact, primaryPhysician,
    } = req.body;

    const profile = await HealthProfile.findOneAndUpdate(
      { patient: req.user._id },
      {
        patient: req.user._id,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        bloodType: bloodType || undefined,
        heightFt: heightFt != null ? heightFt : undefined,
        heightIn: heightIn != null ? heightIn : undefined,
        weightLbs: weightLbs != null ? weightLbs : undefined,
        conditions: conditions || [],
        allergies: allergies || [],
        medications: medications || [],
        emergencyContact: emergencyContact || {},
        primaryPhysician: primaryPhysician || {},
      },
      { new: true, upsert: true, runValidators: true },
    );

    res.json({ success: true, profile });
  } catch (err) {
    console.error('Save health profile error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = { getHealthProfile, saveHealthProfile };
