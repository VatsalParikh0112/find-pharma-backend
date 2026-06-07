const express = require('express');
const { body } = require('express-validator');
const { submitTicket } = require('../controllers/support.controller');
const { protect } = require('../middleware/auth.middleware');
const { withAccount } = require('../utils/account');

// Factory so both portals share the submit route, each pinned to its account type.
const createSupportRouter = accountType => {
  const router = express.Router();

  router.use(withAccount(accountType), protect);

  router.post(
    '/',
    [
      body('subject').trim().notEmpty().withMessage('Subject is required'),
      body('message').trim().notEmpty().withMessage('Message is required'),
    ],
    submitTicket,
  );

  return router;
};

module.exports = createSupportRouter;
