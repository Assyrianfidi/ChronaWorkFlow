import { Router } from "express";
import { transactionsController } from "./transactions.controller.js";

const router = Router();

// Simple routes without complex middleware for testing
router.get("/", transactionsController.list);
router.post("/", transactionsController.create);

export default router;
