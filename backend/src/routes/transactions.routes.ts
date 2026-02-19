import express from "express";
import { authenticate } from "../middleware/auth.js";
const transactionsRouter = require("../modules/transactions/transactions.routes");

const router = express.Router();

// Apply authentication middleware to all transaction routes
router.use(authenticate);
router.use("/", transactionsRouter);

export default router;
