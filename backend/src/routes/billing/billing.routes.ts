import { Router } from "express";
import {
  billingController,
  createSubscriptionValidation,
  cancelSubscriptionValidation,
} from "../../controllers/billing/billing.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();

// Apply authentication to all routes
router.use(protect);

// GET /api/billing/plans - Get available plans
router.get("/plans", billingController.getPlans.bind(billingController));

// POST /api/billing/subscribe - Create subscription
router.post(
  "/subscribe",
  createSubscriptionValidation,
  billingController.createSubscription.bind(billingController),
);

// DELETE /api/billing/subscribe/:subscriptionId - Cancel subscription
router.delete(
  "/subscribe/:subscriptionId",
  cancelSubscriptionValidation,
  billingController.cancelSubscription.bind(billingController),
);

export default router;
