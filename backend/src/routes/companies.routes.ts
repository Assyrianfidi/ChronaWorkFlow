import { Router } from "express";
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/companies.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
export const companyRoutes = router;

// Protect all routes
router.use(protect);

router
  .route("/")
  .get(getCompanies)
  .post(createCompany);

router
  .route("/:id")
  .get(getCompany)
  .patch(updateCompany)
  .delete(deleteCompany);

export default router;
