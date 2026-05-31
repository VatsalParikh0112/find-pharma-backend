const express = require('express');
const { body } = require('express-validator');
const {
  createInsurance,
  getMyInsurances,
  updateInsurance,
  deleteInsurance,
  setDefault,
} = require('../controllers/insurance.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

const insuranceValidators = [
  body('providerName').trim().notEmpty().withMessage('Provider name is required'),
  body('memberId').trim().notEmpty().withMessage('Member ID is required'),
  body('holderName').trim().notEmpty().withMessage('Card holder name is required'),
  body('planType')
    .optional({ checkFalsy: true })
    .isIn(['PPO', 'HMO', 'EPO', 'HDHP', 'POS', 'Medicare', 'Medicaid', 'Other'])
    .withMessage('Invalid plan type'),
  body('rxBIN')
    .optional({ checkFalsy: true })
    .matches(/^\d{6}$/)
    .withMessage('RxBIN must be exactly 6 digits'),
];

router.get('/', getMyInsurances);
router.post('/', insuranceValidators, createInsurance);
router.put('/:id', insuranceValidators, updateInsurance);
router.delete('/:id', deleteInsurance);
router.put('/:id/set-default', setDefault);

module.exports = router;
