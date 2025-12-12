import { Router } from "express";
import invoiceRoutes from "./invoice.routes";
import customerRoutes from "./customer.routes";
import productRoutes from "./product.routes";
import reportsRoutes from "./reports.routes";

const router = Router();

// Register all invoicing routes
router.use("/invoices", invoiceRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/reports", reportsRoutes);

export default router;
