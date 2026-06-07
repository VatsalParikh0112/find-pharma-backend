const express = require('express');
const { body } = require('express-validator');
const {
  login,
  getPharmacies,
  setPharmacyStatus,
  warnPharmacy,
  setAccountStatus,
  getTickets,
  updateTicket,
  getStats,
} = require('../controllers/admin.controller');
const { adminProtect } = require('../middleware/admin.middleware');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login,
);

router.get('/stats', adminProtect, getStats);

router.get('/pharmacies', adminProtect, getPharmacies);
router.put('/pharmacies/:id/status', adminProtect, setPharmacyStatus); // verification
router.post('/pharmacies/:id/warn', adminProtect, warnPharmacy);
router.put('/pharmacies/:id/account', adminProtect, setAccountStatus); // active/disabled

router.get('/support', adminProtect, getTickets);
router.put('/support/:id', adminProtect, updateTicket);

module.exports = router;
