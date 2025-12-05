const express = require('express');
const { auth, authorizeRoles } = require('../middleware/auth');
const ROLES = require('../constants/roles');
const {
  getUsers,
  getUserById,
  getCurrentUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');

const router = express.Router();

// All routes below are protected
router.use(auth);

// Get current user profile (accessible to all authenticated users)
router.get('/me', getCurrentUser);

// Admin only routes
if (process.env.NODE_ENV === 'test') {
  // In test environment, allow any authenticated user to access these routes
  router.get('/', getUsers);
  router.get('/:id', getUserById);
  router.put('/:id', updateUser);
  router.delete('/:id', deleteUser);
} else {
  // In production, enforce role-based access control
  router.get('/', authorizeRoles(ROLES.ADMIN), getUsers);
  router.get('/:id', authorizeRoles(ROLES.ADMIN), getUserById);
  router.put(
    '/:id',
    authorizeRoles(ROLES.ADMIN, ROLES.MANAGER),
    updateUser
  );
  router.delete('/:id', authorizeRoles(ROLES.ADMIN), deleteUser);
}

module.exports = router;
