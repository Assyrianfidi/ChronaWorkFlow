import { Router } from "express";
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import { Role } from "@prisma/client";

const router = Router();
export const userRoutes = router;

// Protect all routes
router.use(protect);

// Current user routes
router.patch("/updateMe", updateMe);
router.delete("/deleteMe", deleteMe);

// Admin only routes
router.use(authorize(Role.ADMIN));

router
  .route("/")
  .get(paginationMiddleware, getAllUsers)
  .post(createUser);

router
  .route("/:id")
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

export default router;
