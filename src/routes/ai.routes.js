const express = require('express');
const { body } = require('express-validator');
const { searchMedicine } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/search',
  protect,
  [body('query').trim().notEmpty().withMessage('query is required')],
  searchMedicine
);

module.exports = router;
