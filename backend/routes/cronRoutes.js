const express = require('express');
const { runSettlementCron } = require('../controllers/cronController');

const router = express.Router();

router.post('/settle', runSettlementCron);

module.exports = router;
