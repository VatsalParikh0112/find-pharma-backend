const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin auth is intentionally Bearer-token only (not cookie-based) so an admin
// session never collides with a pharmacy cookie on the same browser/origin.
const adminProtect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.accountType !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    req.admin = await Admin.findById(decoded.id);
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

module.exports = { adminProtect };
