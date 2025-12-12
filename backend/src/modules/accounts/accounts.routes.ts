import { Router } from "express";
import { accountsController } from "./accounts.controller.js";

const router = Router();

// Simple routes without complex middleware for testing
router.get("/", accountsController.list);
router.post("/", accountsController.create);
router.patch("/:id", accountsController.update);
router.post("/:id/balance", accountsController.adjustBalance);

export default router;
