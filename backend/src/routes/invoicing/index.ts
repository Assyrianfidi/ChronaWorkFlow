import { Router } from "express";
import invoiceRoutes from "./invoice.routes.js";
import customerRoutes from "./customer.routes.js";
import productRoutes from "./product.routes.js";
import reportsRoutes from "./reports.routes.js";

const router = Router();

// Register all invoicing routes
router.use("/invoices", invoiceRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/reports", reportsRoutes);

export default router;
