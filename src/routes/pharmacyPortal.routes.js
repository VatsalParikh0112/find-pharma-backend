const express = require('express');
const { body } = require('express-validator');
const {
  getMyPharmacy,
  submitPharmacy,
  verifyPharmacy,
} = require('../controllers/pharmacyProfile.controller');
const { protect } = require('../middleware/auth.middleware');
const { withAccount } = require('../utils/account');

const router = express.Router();

// Public: admin clicks approve/reject from the verification email.
router.get('/verify', verifyPharmacy);

// Everything below operates on a logged-in pharmacy account only.
router.use(withAccount('pharmacy'), protect);

router.get('/profile', getMyPharmacy);

router.post(
  '/profile',
  [
    body('name').trim().notEmpty().withMessage('Pharmacy name is required'),
    body('npiNumber')
      .trim()
      .matches(/^\d{10}$/)
      .withMessage('NPI must be a 10-digit number'),
    body('stateLicenseNumber').trim().notEmpty().withMessage('State license number is required'),
    body('licenseState').trim().notEmpty().withMessage('License state is required'),
    body('street').trim().notEmpty().withMessage('Street address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('pincode').trim().notEmpty().withMessage('ZIP code is required'),
    body('openingHours').optional({ checkFalsy: true }).trim(),
  ],
  submitPharmacy,
);

module.exports = router;
