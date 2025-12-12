const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
} = require("../controllers/auth.controller");
const { auth, authorizeRoles } = require("../middleware/auth");
const ROLES = require("../constants/roles");

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", register);

// @desc    Login user and get token
// @route   POST /api/auth/login
// @access  Public
router.post("/login", login);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", auth, getMe);

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", auth, logout);

// @desc    Check if user has admin/manager role
// @route   GET /api/auth/check-admin
// @access  Private
router.get(
  "/check-admin",
  auth,
  authorizeRoles(ROLES.ADMIN, ROLES.MANAGER),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "You have admin/manager access",
      user: req.user,
    });
  },
);

module.exports = router;
