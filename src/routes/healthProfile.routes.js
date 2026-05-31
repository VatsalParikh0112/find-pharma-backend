const express = require('express');
const { getHealthProfile, saveHealthProfile } = require('../controllers/healthProfile.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.get('/', getHealthProfile);
router.put('/', saveHealthProfile);

module.exports = router;
