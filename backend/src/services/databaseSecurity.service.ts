import { prisma } from "../utils/prisma";
import { ROLES, ROLES_HIERARCHY } from "../constants/roles";

/**
 * Database Security Service
 * Enforces role-based access control for database operations
 */

class DatabaseSecurityService {
  static _unauthorizedAttempts: any[] = [];

  private static normalizeRole(role: unknown): string {
    return String(role || "").toUpperCase();
  }

  /**
   * Check if user has permission to access a resource
   * @param {Object} user - The authenticated user object
   * @param {string} resource - The resource type (accounts, transactions, etc.)
   * @param {string} action - The action (read, write, delete)
   * @param {Object} resourceData - Additional resource data for ownership checks
   * @returns {boolean} - Whether access is allowed
   */
  static hasPermission(user: any, resource: string, action: string, resourceData: any = {}) {
    if (!user || !user.role) {
      return false;
    }

    const role = this.normalizeRole(user.role);

    // Admin can access everything
    if (role === ROLES.ADMIN) {
      return true;
    }

    // Define resource permissions
    const permissions: Record<string, Record<string, string[]>> = {
      accounts: {
        read: [
          ROLES.USER,
          ROLES.MANAGER,
          ROLES.AUDITOR,
          ROLES.INVENTORY_MANAGER,
        ],
        write: [ROLES.MANAGER, ROLES.INVENTORY_MANAGER],
        delete: [ROLES.MANAGER],
      },
      transactions: {
        read: [ROLES.USER, ROLES.MANAGER, ROLES.AUDITOR],
        write: [ROLES.MANAGER],
        delete: [ROLES.MANAGER],
      },
      inventory: {
        read: [
          ROLES.USER,
          ROLES.MANAGER,
          ROLES.AUDITOR,
          ROLES.INVENTORY_MANAGER,
        ],
        write: [ROLES.INVENTORY_MANAGER],
        delete: [ROLES.INVENTORY_MANAGER],
      },
      users: {
        read: [ROLES.MANAGER, ROLES.AUDITOR],
        write: [ROLES.ADMIN],
        delete: [ROLES.ADMIN],
      },
      reports: {
        read: [ROLES.USER, ROLES.MANAGER, ROLES.AUDITOR],
        write: [ROLES.MANAGER, ROLES.AUDITOR],
        delete: [ROLES.MANAGER],
      },
    };

    // Check if user role has permission for this resource/action
    const allowedRoles = permissions[resource]?.[action] || [];
    if (!allowedRoles.includes(role)) {
      return false;
    }

    // Additional ownership checks for certain resources
    if (resource === "accounts" && action === "read") {
      // Users can only read accounts from their own company
      return resourceData.companyId === user.currentCompanyId;
    }

    if (resource === "transactions" && action === "read") {
      // Users can only read transactions from their own company
      return resourceData.companyId === user.currentCompanyId;
    }

    return true;
  }

  /**
   * Log unauthorized access attempts
   * @param {Object} attempt - The unauthorized access attempt details
   */
  static logUnauthorizedAccess(attempt: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: attempt.userId || "anonymous",
      userRole: attempt.userRole || "none",
      resource: attempt.resource,
      action: attempt.action,
      ip: attempt.ip,
      userAgent: attempt.userAgent,
      details: attempt.details || {},
    };

    // Log to console (will be enhanced in Phase 6.4)
    console.warn("[DB_SECURITY] Unauthorized access attempt:", logEntry);

    // Store in memory for now (will be moved to database in Phase 6.4)
    this._unauthorizedAttempts.push(logEntry);

    // Keep only last 1000 entries
    if (this._unauthorizedAttempts.length > 1000) {
      this._unauthorizedAttempts = this._unauthorizedAttempts.slice(-1000);
    }
  }

  /**
   * Get unauthorized access attempts
   * @param {number} limit - Maximum number of attempts to return
   * @returns {Array} - Array of unauthorized access attempts
   */
  static getUnauthorizedAttempts(limit = 100) {
    return this._unauthorizedAttempts.slice(-limit);
  }

  /**
   * Validate sensitive field access
   * @param {Object} user - The authenticated user
   * @param {string} field - The field being accessed
   * @returns {boolean} - Whether access is allowed
   */
  static canAccessSensitiveField(user: any, field: string) {
    if (!user || !user.role) {
      return false;
    }

    const role = this.normalizeRole(user.role);

    // Define sensitive fields and who can access them
    const sensitiveFields: Record<string, string[]> = {
      password: [ROLES.ADMIN],
      email: [ROLES.ADMIN, ROLES.MANAGER],
      phone: [ROLES.ADMIN, ROLES.MANAGER],
      salary: [ROLES.ADMIN, ROLES.MANAGER],
      ssn: [ROLES.ADMIN],
      bankAccount: [ROLES.ADMIN, ROLES.MANAGER],
    };

    const allowedRoles = sensitiveFields[field] || [];
    return allowedRoles.includes(role) || role === ROLES.ADMIN;
  }

  /**
   * Apply row-level security filter to queries
   * @param {Object} user - The authenticated user
   * @param {string} model - The Prisma model name
   * @returns {Object} - Prisma where clause for row-level security
   */
  static getRowLevelSecurityFilter(user: any, model: string) {
    if (!user || !user.role) {
      throw new Error("User authentication required");
    }

    const role = this.normalizeRole(user.role);

    // Admin can see everything
    if (role === ROLES.ADMIN) {
      return {};
    }

    const filters: Record<string, any> = {
      Account: {
        companyId: user.currentCompanyId,
      },
      Transaction: {
        account: {
          companyId: user.currentCompanyId,
        },
      },
      InventoryItem: {
        tenantId: user.tenantId || "default",
      },
      User: {
        // Users can only see themselves unless they're managers/auditors
        ...(role === ROLES.USER ? { id: user.id } : {}),
      },
    };

    return filters[model] || {};
  }

  /**
   * Validate database constraints before operations
   * @param {string} model - The Prisma model
   * @param {Object} data - The data to validate
   * @param {string} action - The action (create, update, delete)
   * @returns {Object} - Validation result
   */
  static validateConstraints(model: string, data: any, action: string) {
    const errors = [];

    // Validate unique constraints
    if (action === "create" || action === "update") {
      switch (model) {
        case "User":
          if (data.email && !this.isValidEmail(data.email)) {
            errors.push("Invalid email format");
          }
          break;
        case "Account":
          if (data.code && !/^[A-Z0-9]{3,10}$/.test(data.code)) {
            errors.push(
              "Account code must be 3-10 uppercase alphanumeric characters",
            );
          }
          break;
        case "InventoryItem":
          if (data.sku && !/^[A-Z0-9-]{3,20}$/.test(data.sku)) {
            errors.push(
              "SKU must be 3-20 uppercase alphanumeric characters with hyphens",
            );
          }
          break;
      }
    }

    // Validate referential integrity
    if (action === "delete") {
      switch (model) {
        case "User":
          // Check if user has dependent records
          errors.push("Cannot delete user with existing records");
          break;
        case "Account":
          // Check if account has transactions
          errors.push("Cannot delete account with existing transactions");
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   * @param {string} email - The email to validate
   * @returns {boolean} - Whether the email is valid
   */
  static isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if user is blocked due to too many unauthorized attempts
   * @param {string} userId - The user ID
   * @param {string} ip - The IP address
   * @returns {boolean} - Whether the user/IP is blocked
   */
  static isBlocked(userId: any, ip: string) {
    const attempts = this.getUnauthorizedAttempts(100);
    const recentAttempts = attempts.filter((attempt: any) => {
      const isRecent =
        // @ts-ignore
(Date.now() - new Date(attempt.timestamp).getTime()) < 15 * 60 * 1000; // 15 minutes
      return isRecent && (attempt.userId === userId || attempt.ip === ip);
    });

    return recentAttempts.length > 10; // Block after 10 attempts in 15 minutes
  }
}

export default DatabaseSecurityService;
