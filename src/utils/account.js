const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PharmacyUser = require('../models/PharmacyUser');
const Admin = require('../models/Admin');

// Each account type maps to its own collection. The type is baked into the JWT
// so a token issued for one portal can never resolve a user in the other.
const ACCOUNT_MODELS = {
  patient: User,
  pharmacy: PharmacyUser,
  admin: Admin,
};

const getModelForType = accountType => ACCOUNT_MODELS[accountType] || null;

// Sign a token that carries both the user id and which collection it belongs to.
const generateToken = (id, accountType) =>
  jwt.sign({ id, accountType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Route-level middleware: pins every handler in a router to one account type.
const withAccount = accountType => (req, _res, next) => {
  req.account = { accountType, Model: getModelForType(accountType) };
  next();
};

module.exports = { ACCOUNT_MODELS, getModelForType, generateToken, withAccount };
