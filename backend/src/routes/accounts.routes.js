const express = require('express');
const { authenticate } = require('../middleware/auth');
const accountsRouter = require('../modules/accounts/accounts.routes');

const router = express.Router();

// Apply authentication middleware to all account routes
router.use(authenticate);
router.use('/', accountsRouter);

module.exports = router;
