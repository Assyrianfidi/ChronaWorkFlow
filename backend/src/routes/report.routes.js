const express = require('express');
const { auth, authorizeRoles } = require('../middleware/auth');
const ROLES = require('../constants/roles');
const reportController = require('../controllers/report.controller');

// Destructure controller methods
const {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
} = reportController;

const router = express.Router();

// All routes below are protected
router.use(auth);

// Get all reports - accessible by all authenticated users
router.get('/', getReports);

// Get single report by ID - accessible by owner or admin
router.get('/:id', getReportById);

// Create report - accessible by admin, manager, and assistant_manager
router.post(
  '/',
  authorizeRoles(
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.ASSISTANT_MANAGER
  ),
  createReport
);

// Update report - accessible by admin, manager, and assistant_manager
router.put(
  '/:id',
  authorizeRoles(
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.ASSISTANT_MANAGER
  ),
  updateReport
);

// Delete report - admin or report owner can delete
router.delete('/:id', deleteReport);

module.exports = router;
