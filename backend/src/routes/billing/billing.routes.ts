import { Router } from "express";
import {
  billingController,
  validateCreateSubscription,
  validateUpdateSubscription,
  validateCreatePaymentIntent,
} from "../../controllers/billing/billing.controller";
import { auth, authorizeRoles } from "../../middleware/auth";
import { ROLES } from "../../constants/roles";

const router = Router();

// Apply authentication to all routes
router.use(auth);

// GET /api/billing/plans - Get available plans
router.get("/plans", billingController.getPlans.bind(billingController));

// POST /api/billing/subscribe - Create subscription
router.post(
  "/subscribe",
  authorizeRoles([ROLES.ADMIN, ROLES.MANAGER]),
  validateCreateSubscription,
  billingController.createSubscription.bind(billingController),
);

// DELETE /api/billing/subscribe/:subscriptionId - Cancel subscription
router.delete(
  "/subscribe/:subscriptionId",
  authorizeRoles([ROLES.ADMIN, ROLES.MANAGER]),
  billingController.cancelSubscription.bind(billingController),
);

// GET /api/billing/subscription - Get current subscription
router.get(
  "/subscription",
  billingController.getSubscription.bind(billingController),
);

// PUT /api/billing/subscription - Update subscription
router.put(
  "/subscription",
  authorizeRoles([ROLES.ADMIN, ROLES.MANAGER]),
  validateUpdateSubscription,
  billingController.updateSubscription.bind(billingController),
);

// POST /api/billing/payment-intent - Create payment intent
router.post(
  "/payment-intent",
  validateCreatePaymentIntent,
  billingController.createPaymentIntent.bind(billingController),
);

// GET /api/billing/history - Get billing history
router.get(
  "/history",
  billingController.getBillingHistory.bind(billingController),
);

// POST /api/billing/webhook - Handle Stripe webhook
router.post(
  "/webhook",
  billingController.handleWebhook.bind(billingController),
);

export default router;
