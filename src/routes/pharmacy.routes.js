const express = require('express');
const { getPharmacies } = require('../controllers/pharmacy.controller');

const router = express.Router();

router.get('/', getPharmacies);

module.exports = router;
