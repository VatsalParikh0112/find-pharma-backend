const express = require('express');
const {
  getStats,
  getRequests,
  approve,
  reject,
  markCollected,
  cancelUncollected,
  updateNotes,
} = require('../controllers/pharmacyRequest.controller');
const { protect } = require('../middleware/auth.middleware');
const { withAccount } = require('../utils/account');

const router = express.Router();

// All routes are for the logged-in pharmacy account only.
router.use(withAccount('pharmacy'), protect);

router.get('/stats', getStats);
router.get('/', getRequests);
router.put('/:id/approve', approve);
router.put('/:id/reject', reject);
router.put('/:id/collect', markCollected);
router.put('/:id/cancel', cancelUncollected);
router.put('/:id/notes', updateNotes);

module.exports = router;
