// @ts-ignore
import { PrismaClient } from "@prisma/client";

// Create a singleton instance for production
let prismaInstance = null;

function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = PrismaClientSingleton.getInstance();
  }
  return prismaInstance;
}

/**
 * Database Constraint Service
 * Validates and enforces database constraints and business rules
 */

class DatabaseConstraintsService {
  /**
   * Set the Prisma client instance (for testing)
   * @param {PrismaClient} prisma - The Prisma client instance
   */
  static setPrismaInstance(prisma) {
    prismaInstance = prisma;
  }
  /**
   * Validate unique constraints before creating/updating records
   * @param {string} model - The Prisma model name
   * @param {Object} data - The data to validate
   * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
   * @returns {Object} - Validation result
   */
  static async validateUniqueConstraints(model, data, excludeId = null) {
    const errors = [];

    try {
      const prisma = getPrismaInstance();

      switch (model) {
        case "User":
          if (data.email) {
            const whereClause = { email: data.email };
            if (excludeId) {
              // Fixed dynamic property access
// whereClause.id = { not: excludeId };
            }
            const existing = await prisma.user.findFirst({
              where: whereClause,
            });
            if (existing) {
              errors.push("Email already exists");
            }
          }
          break;

        case "Account":
          if (data.code && data.companyId) {
            const whereClause = {
              companyId_code: {
                companyId: data.companyId,
                code: data.code,
              },
            };
            if (excludeId) {
              // Fixed dynamic property access
// whereClause.id = { not: excludeId };
            }
            const existing = await prisma.account.findFirst({
              where: whereClause,
            });
            if (existing) {
              errors.push("Account code already exists in this company");
            }
          }
          break;

        case "InventoryItem":
          if (data.sku) {
            const whereClause = { sku: data.sku };
            if (excludeId) {
              // Fixed dynamic property access
// whereClause.id = { not: excludeId };
            }
            const existing = await prisma.inventoryItem.findFirst({
              where: whereClause,
            });
            if (existing) {
              errors.push("SKU already exists");
            }
          }
          if (data.barcode) {
            const whereClause = { barcode: data.barcode };
            if (excludeId) {
              // Fixed dynamic property access
// whereClause.id = { not: excludeId };
            }
            const existing = await prisma.inventoryItem.findFirst({
              where: whereClause,
            });
            if (existing) {
              errors.push("Barcode already exists");
            }
          }
          break;

        case "Category":
          if (data.name) {
            const whereClause = { name: data.name };
            if (excludeId) {
              // Fixed dynamic property access
// whereClause.id = { not: excludeId };
            }
            const existing = await prisma.category.findFirst({
              where: whereClause,
            });
            if (existing) {
              errors.push("Category name already exists");
            }
          }
          break;

        case "CompanyMember":
          if (data.companyId && data.userId) {
            const whereClause = {
              companyId_userId: {
                companyId: data.companyId,
                userId: data.userId,
              },
            };
            if (excludeId) {
              // Fixed dynamic property access
// whereClause.id = { not: excludeId };
            }
            const existing = await prisma.companyMember.findFirst({
              where: whereClause,
            });
            if (existing) {
              errors.push("User is already a member of this company");
            }
          }
          break;

        case "ReconciliationReport":
          if (data.title && data.userId) {
            const whereClause = {
              title_userId: {
                title: data.title,
                userId: data.userId,
              },
            };
            if (excludeId) {
              // Fixed dynamic property access
// whereClause.id = { not: excludeId };
            }
            const existing = await prisma.reconciliationReport.findFirst({
              where: whereClause,
            });
            if (existing) {
              errors.push("Report title already exists for this user");
            }
          }
          break;
      }
    } catch (error) {
      console.error("Error validating unique constraints:", error);
      errors.push("Database validation error");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate foreign key constraints
   * @param {string} model - The Prisma model name
   * @param {Object} data - The data to validate
   * @returns {Object} - Validation result
   */
  static async validateForeignKeyConstraints(model, data) {
    const errors = [];

    try {
      const prisma = getPrismaInstance();

      switch (model) {
        case "Account":
          if (data.parentId) {
            const parent = await prisma.account.findUnique({
              where: { id: data.parentId },
              select: { id: true, companyId: true },
            });
            if (!parent) {
              errors.push("Parent account not found");
            } else if (data.companyId && parent.companyId !== data.companyId) {
              errors.push("Parent account must belong to the same company");
            }
          }
          break;

        case "InventoryItem":
          if (data.categoryId) {
            const category = await prisma.category.findUnique({
              where: { id: data.categoryId },
              select: { id: true },
            });
            if (!category) {
              errors.push("Category not found");
            }
          }
          if (data.supplierId) {
            const supplier = await prisma.supplier.findUnique({
              where: { id: data.supplierId },
              select: { id: true },
            });
            if (!supplier) {
              errors.push("Supplier not found");
            }
          }
          if (data.createdById) {
            const user = await prisma.user.findUnique({
              where: { id: data.createdById },
              select: { id: true },
            });
            if (!user) {
              errors.push("Created by user not found");
            }
          }
          break;

        case "InventoryHistory":
          if (data.itemId) {
            const item = await prisma.inventoryItem.findUnique({
              where: { id: data.itemId },
              select: { id: true },
            });
            if (!item) {
              errors.push("Inventory item not found");
            }
          }
          if (data.createdById) {
            const user = await prisma.user.findUnique({
              where: { id: data.createdById },
              select: { id: true },
            });
            if (!user) {
              errors.push("Created by user not found");
            }
          }
          break;

        case "CompanyMember":
          if (data.companyId) {
            const company = await prisma.company.findUnique({
              where: { id: data.companyId },
              select: { id: true },
            });
            if (!company) {
              errors.push("Company not found");
            }
          }
          if (data.userId) {
            const user = await prisma.user.findUnique({
              where: { id: data.userId },
              select: { id: true },
            });
            if (!user) {
              errors.push("User not found");
            }
          }
          break;

        case "RefreshToken":
          if (data.userId) {
            const user = await prisma.user.findUnique({
              where: { id: data.userId },
              select: { id: true },
            });
            if (!user) {
              errors.push("User not found");
            }
          }
          break;
      }
    } catch (error) {
      console.error("Error validating foreign key constraints:", error);
      errors.push("Database validation error");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate business rules and constraints
   * @param {string} model - The Prisma model name
   * @param {Object} data - The data to validate
   * @param {string} action - The action (create, update, delete)
   * @returns {Object} - Validation result
   */
  static async validateBusinessRules(model, data, action) {
    const errors = [];

    try {
      switch (model) {
        case "Account":
          // Validate account hierarchy
          if (data.parentId && data.id && data.parentId === data.id) {
            errors.push("Account cannot be its own parent");
          }

          // Validate account code format
          if (data.code && !/^[A-Z0-9]{3,10}$/.test(data.code)) {
            errors.push(
              "Account code must be 3-10 uppercase alphanumeric characters",
            );
          }

          // Validate account type hierarchy rules
          if (data.parentId && data.type) {
            const parent = await prisma.account.findUnique({
              where: { id: data.parentId },
              select: { type: true },
            });
            if (parent) {
              // Asset accounts can only have asset children
              // Liability accounts can only have liability children
              // Equity accounts can only have equity children
              if (parent.type !== data.type) {
                errors.push("Child account must be of same type as parent");
              }
            }
          }
          break;

        case "InventoryItem":
          // Validate SKU format
          if (data.sku && !/^[A-Z0-9-]{3,20}$/.test(data.sku)) {
            errors.push(
              "SKU must be 3-20 uppercase alphanumeric characters with hyphens",
            );
          }

          // Validate business logic
          if (data.quantity < 0) {
            errors.push("Quantity cannot be negative");
          }

          if (data.costPrice < 0 || data.sellingPrice < 0) {
            errors.push("Prices cannot be negative");
          }

          if (data.reorderPoint < 0) {
            errors.push("Reorder point cannot be negative");
          }

          // Validate selling price is greater than cost price
          if (
            data.costPrice &&
            data.sellingPrice &&
            data.sellingPrice < data.costPrice
          ) {
            errors.push(
              "Selling price must be greater than or equal to cost price",
            );
          }
          break;

        case "User":
          // Validate email format
          if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push("Invalid email format");
          }

          // Validate password strength
          if (
            data.password &&
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
              data.password,
            )
          ) {
            errors.push(
              "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
            );
          }
          break;

        case "Transaction":
          // Validate double-entry accounting
          if (data.debits && data.credits) {
            const totalDebits = data.debits.reduce(
              (sum, debit: any) => sum + Number(debit.amount),
              0,
            );
            const totalCredits = data.credits.reduce(
              (sum, credit: any) => sum + Number(credit.amount),
              0,
            );

            if (Math.abs(totalDebits - totalCredits) > 0.01) {
              errors.push("Total debits must equal total credits");
            }
          }
          break;
      }

      // Additional validation for delete operations
      if (action === "delete") {
        const prisma = getPrismaInstance();

        switch (model) {
          case "User":
            // Check if user has dependent records
            const userDependents = await prisma.refreshToken.count({
              where: { userId: parseInt(data.id) },
            });
            if (userDependents > 0) {
              errors.push("Cannot delete user with existing refresh tokens");
            }
            break;

          case "Account":
            // Check if account has transactions
            const accountTransactions = await prisma.transaction.count({
              where: {
                OR: [{ debitAccountId: data.id }, { creditAccountId: data.id }],
              },
            });
            if (accountTransactions > 0) {
              errors.push("Cannot delete account with existing transactions");
            }

            // Check if account has child accounts
            const childAccounts = await prisma.account.count({
              where: { parentId: data.id },
            });
            if (childAccounts > 0) {
              errors.push("Cannot delete account with child accounts");
            }
            break;
        }
      }
    } catch (error) {
      console.error("Error validating business rules:", error);
      errors.push("Business rule validation error");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Comprehensive validation for database operations
   * @param {string} model - The Prisma model name
   * @param {Object} data - The data to validate
   * @param {string} action - The action (create, update, delete)
   * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
   * @returns {Object} - Comprehensive validation result
   */
  static async validate(model, data, action, excludeId = null) {
    const results = await Promise.all([
      this.validateUniqueConstraints(model, data, excludeId),
      this.validateForeignKeyConstraints(model, data),
      this.validateBusinessRules(model, data, action),
    ]);

    const allErrors = [
      ...results[0].errors,
      ...results[1].errors,
      ...results[2].errors,
    ];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

export default DatabaseConstraintsService;
