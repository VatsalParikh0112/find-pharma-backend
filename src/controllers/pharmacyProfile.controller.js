const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Pharmacy = require('../models/Pharmacy');
const {
  sendPharmacyVerificationEmail,
  sendPharmacyStatusEmail,
} = require('../services/email.service');

// Geocode a US address to [lng, lat]. Primary source is Zippopotam (a fast,
// key-less US ZIP service that works reliably from serverless IPs). Nominatim
// is a fallback — it's accurate but often rate-limits cloud IPs, which is why
// geocoding failed on Vercel.
const geocodeByZip = async pincode => {
  try {
    const url = `https://api.zippopotam.us/us/${encodeURIComponent(pincode.trim())}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return null;
    const data = await response.json();
    const place = data.places && data.places[0];
    if (!place) return null;
    return [parseFloat(place.longitude), parseFloat(place.latitude)];
  } catch {
    return null;
  }
};

const geocodeByNominatim = async ({ street, city, state, pincode }) => {
  const lookup = async params => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?${params}&country=US&format=json&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'FindMyPharma/1.0 (support@findmypharma.com)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.length) return null;
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    } catch {
      return null;
    }
  };

  const full = [street, city, state, pincode].filter(Boolean).join(', ');
  return (
    (full && (await lookup(`q=${encodeURIComponent(full)}`))) ||
    (pincode && (await lookup(`postalcode=${encodeURIComponent(pincode)}`))) ||
    null
  );
};

const geocode = async ({ street, city, state, pincode }) => {
  // ZIP first (reliable on serverless), then fall back to address-level lookup.
  return (
    (pincode && (await geocodeByZip(pincode))) ||
    (await geocodeByNominatim({ street, city, state, pincode })) ||
    null
  );
};

// Test NPIs that pass verification when NOT in production. Lets you exercise
// the full flow without access to a real pharmacy. Ignored in production.
const TEST_NPIS = new Set(['1234567893', '1987654321', '1999999984', '0000000000']);

// Verify an NPI against the public NPPES government registry. Returns the
// matched organization name, or null if the NPI doesn't exist / isn't a
// pharmacy organization.
const verifyNpi = async npiNumber => {
  // Test NPIs pass in all environments for now (demo). Remove before going live.
  if (TEST_NPIS.has(npiNumber)) {
    return 'Test Pharmacy (demo)';
  }

  try {
    const url = `https://npiregistry.cms.gov/api/?version=2.1&number=${encodeURIComponent(npiNumber)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.result_count || !data.results?.length) return null;

    const record = data.results[0];
    // NPI-2 = organization (a pharmacy is an organization, not an individual).
    if (record.enumeration_type && record.enumeration_type !== 'NPI-2') return null;

    return record.basic?.organization_name || record.basic?.name || 'Verified provider';
  } catch {
    return null;
  }
};

const adminEmail = () => process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

const buildVerifyUrl = (pharmacyId, action) => {
  const token = jwt.sign({ pid: pharmacyId.toString(), action }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  const base = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
    /\/$/,
    '',
  );
  return `${base}/api/pharmacy/verify?token=${token}`;
};

// GET /api/pharmacy/profile (protected, pharmacy)
// Returns this pharmacy account's listing + verification status (or null).
const getMyPharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
    res.json({ success: true, pharmacy });
  } catch (err) {
    console.error('Get my pharmacy error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/pharmacy/profile (protected, pharmacy)
// Creates or updates the listing, sets it back to "pending", geocodes the
// address, and emails the admin for verification.
const submitPharmacy = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, street, city, state, pincode, openingHours, npiNumber, stateLicenseNumber, licenseState } =
    req.body;

  try {
    // Confirm the NPI is a real, registered pharmacy organization.
    const npiRegistryName = await verifyNpi(npiNumber);
    if (!npiRegistryName) {
      return res.status(400).json({
        success: false,
        message:
          'That NPI number could not be verified as a registered pharmacy in the national registry. Please double-check it.',
      });
    }

    const coordinates = await geocode({ street, city, state, pincode });
    if (!coordinates) {
      return res.status(400).json({
        success: false,
        message: 'We could not locate that address. Please check the street, city, state and ZIP.',
      });
    }

    const update = {
      owner: req.user._id,
      name,
      // Email and phone come from the already-verified account.
      email: req.user.email,
      phone: req.user.phone,
      address: { street, city, state, pincode },
      location: { type: 'Point', coordinates },
      openingHours,
      npiNumber,
      npiVerified: true,
      npiRegistryName,
      stateLicenseNumber,
      licenseState,
      verificationStatus: 'pending',
      rejectionReason: undefined,
      isActive: true,
    };

    const pharmacy = await Pharmacy.findOneAndUpdate({ owner: req.user._id }, update, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });

    try {
      await sendPharmacyVerificationEmail(adminEmail(), {
        pharmacy,
        approveUrl: buildVerifyUrl(pharmacy._id, 'approve'),
        rejectUrl: buildVerifyUrl(pharmacy._id, 'reject'),
      });
    } catch (mailErr) {
      console.error('Pharmacy verification email failed:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Details submitted. We will email you once an admin reviews your pharmacy.',
      pharmacy,
    });
  } catch (err) {
    console.error('Submit pharmacy error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/pharmacy/profile/details (protected, pharmacy)
// Lets an approved pharmacy edit only the non-credential fields (address,
// opening hours). Name, NPI and state license are immutable here, and the
// verification status is left untouched.
const updateDetails = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { street, city, state, pincode, openingHours } = req.body;

  try {
    const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    const coordinates = await geocode({ street, city, state, pincode });
    if (!coordinates) {
      return res.status(400).json({
        success: false,
        message: 'We could not locate that address. Please check the street, city, state and ZIP.',
      });
    }

    pharmacy.address = { street, city, state, pincode };
    pharmacy.location = { type: 'Point', coordinates };
    if (openingHours !== undefined) pharmacy.openingHours = openingHours;
    await pharmacy.save();

    res.json({ success: true, message: 'Details updated', pharmacy });
  } catch (err) {
    console.error('Update details error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/pharmacy/verify?token=... (public — clicked from admin email)
const verifyPharmacy = async (req, res) => {
  const page = (title, body, color) => `
    <div style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:32px;background:#064e3b;border-radius:16px;color:white;text-align:center;">
      <h2 style="color:${color};margin:0 0 12px;">${title}</h2>
      <p style="color:rgba(255,255,255,0.8);line-height:1.6;margin:0;">${body}</p>
    </div>`;

  try {
    const { token } = req.query;
    const { pid, action } = jwt.verify(token, process.env.JWT_SECRET);

    const pharmacy = await Pharmacy.findById(pid);
    if (!pharmacy) {
      return res.status(404).send(page('Not found', 'This pharmacy no longer exists.', '#fca5a5'));
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    if (pharmacy.verificationStatus === newStatus) {
      return res.send(
        page('Already done', `This pharmacy is already ${newStatus}.`, '#6ee7b7'),
      );
    }

    pharmacy.verificationStatus = newStatus;
    pharmacy.isActive = newStatus === 'approved';
    await pharmacy.save();

    if (pharmacy.email) {
      try {
        await sendPharmacyStatusEmail(pharmacy.email, {
          pharmacyName: pharmacy.name,
          status: newStatus,
        });
      } catch (mailErr) {
        console.error('Pharmacy status email failed:', mailErr.message);
      }
    }

    return res.send(
      page(
        newStatus === 'approved' ? 'Pharmacy approved ✅' : 'Pharmacy rejected',
        `${pharmacy.name} has been ${newStatus}. The pharmacy has been notified by email.`,
        newStatus === 'approved' ? '#6ee7b7' : '#fca5a5',
      ),
    );
  } catch {
    return res
      .status(400)
      .send(page('Invalid or expired link', 'Please request a fresh verification email.', '#fca5a5'));
  }
};

module.exports = { getMyPharmacy, submitPharmacy, updateDetails, verifyPharmacy };
