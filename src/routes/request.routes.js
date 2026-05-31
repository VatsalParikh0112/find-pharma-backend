const express = require('express');
const { body } = require('express-validator');
const {
  createRequest,
  getMyRequests,
  getMyActiveRequests,
  cancelRequest,
  getPharmacyRequests,
} = require('../controllers/request.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('pharmacyId').notEmpty().withMessage('Pharmacy is required'),
    body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
    body('quantity').optional({ checkFalsy: true }).trim(),
    body('notes')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  createRequest,
);

router.get('/my', getMyRequests);
router.get('/my/active', getMyActiveRequests);
router.delete('/:id', cancelRequest);
router.get('/pharmacy/:pharmacyId', getPharmacyRequests);

module.exports = router;
