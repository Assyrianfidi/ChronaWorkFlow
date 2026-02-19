import { Router } from "express";
import { protect as authenticate } from '../middleware/auth.middleware.js';
import { exportUserData, deleteAccount } from '../controllers/gdpr.controller.js';
import { body } from "express-validator";

const router = Router();
export const gdprRoutes = router;

// All GDPR routes require authentication
router.use(authenticate);

// GET /api/gdpr/export — Data portability (Article 20)
router.get("/export", exportUserData);

// DELETE /api/gdpr/delete-account — Right to erasure (Article 17)
router.delete(
  "/delete-account",
  [
    body("confirmEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please confirm your email address"),
  ],
  deleteAccount,
);

export default router;
