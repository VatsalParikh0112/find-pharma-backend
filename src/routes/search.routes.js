const express = require('express');
const { body } = require('express-validator');
const { saveSearch, getMySearchHistory } = require('../controllers/search.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('medicines')
      .isArray({ min: 1 })
      .withMessage('At least one medicine is required'),
    body('medicines.*.name')
      .trim()
      .notEmpty()
      .withMessage('Medicine name is required'),
  ],
  saveSearch,
);

router.get('/my', getMySearchHistory);

module.exports = router;
