import { Router } from "express";
import { Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { prisma } from "../../utils/prisma.js";
import { auth, authorizeRoles } from "../../middleware/auth.js";
import { ROLES } from "../../constants/roles.js";

const router = Router();

// Apply authentication to all routes
router.use(auth);

// GET /api/customers - List customers
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: "insensitive" } },
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.customers.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error("Error listing customers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customers.findUnique({
      where: { id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    console.error("Error getting customer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/customers - Create customer (ADMIN, ACCOUNTANT only)
router.post(
  "/",
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  [
    body("companyName").optional().isString(),
    body("firstName").optional().isString(),
    body("lastName").optional().isString(),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("phone").optional().isString(),
    body("province").optional().isString(),
    body("country").optional().isString(),
    body("address").optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const customer = await prisma.customers.create({
        data: req.body,
      });

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });
    } catch (error: any) {
      console.error("Error creating customer:", error);
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// PUT /api/customers/:id - Update customer (ADMIN, ACCOUNTANT only)
router.put(
  "/:id",
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  [
    body("companyName").optional().isString(),
    body("firstName").optional().isString(),
    body("lastName").optional().isString(),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("phone").optional().isString(),
    body("province").optional().isString(),
    body("country").optional().isString(),
    body("address").optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;

      const customer = await prisma.customers.update({
        where: { id },
        data: req.body,
      });

      res.json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (error: any) {
      console.error("Error updating customer:", error);
      if (
        error instanceof Error &&
        error.message.includes("Record to update not found")
      ) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// DELETE /api/customers/:id - Delete customer (ADMIN only)
router.delete(
  "/:id",
  authorizeRoles([ROLES.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if customer has invoices
      const invoiceCount = await prisma.invoices.count({
        where: { clientId: id },
      });

      if (invoiceCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete customer with existing invoices",
        });
      }

      await prisma.customers.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      if (
        error instanceof Error &&
        error.message.includes("Record to delete does not exist")
      ) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
