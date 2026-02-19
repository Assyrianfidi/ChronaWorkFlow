import express from "express";
import { authenticate } from "../middleware/auth.js";
const accountsRouter = require("../modules/accounts/accounts.routes");

const router = express.Router();

// Apply authentication middleware to all account routes
router.use(authenticate);
router.use("/", accountsRouter);

export default router;
