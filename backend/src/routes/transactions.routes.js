const express = require('express');
const { authenticate } = require('../middleware/auth');
const transactionsRouter = require('../modules/transactions/transactions.routes');

const router = express.Router();

// Apply authentication middleware to all transaction routes
router.use(authenticate);
router.use('/', transactionsRouter);

module.exports = router;
