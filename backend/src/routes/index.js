const express = require('express');
const router = express.Router();

// Import route handlers
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const reportRoutes = require('./report.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
