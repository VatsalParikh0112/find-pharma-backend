const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone')
      .optional({ checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage('Please enter a valid 10-digit phone number'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', protect, getMe);

module.exports = router;
