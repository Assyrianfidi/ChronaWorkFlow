"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var supertest_1 = require("supertest");
var express_1 = require("express");
var databaseSecurity_service_js_1 = require("../../services/databaseSecurity.service.js");
var databaseSecurity_middleware_js_1 = require("../../middleware/security/databaseSecurity.middleware.js");
// Mock Prisma Client
jest.mock("@prisma/client", function () {
  return {
    PrismaClient: jest.fn().mockImplementation(function () {
      return {
        user: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
        },
        account: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
        },
        inventoryItem: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
        },
        category: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
        },
        companyMember: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
        },
        reconciliationReport: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
        },
        refreshToken: {
          count: jest.fn(),
        },
        transaction: {
          count: jest.fn(),
        },
      };
    }),
  };
});
// Mock roles constants
jest.mock("../../constants/roles.js", function () {
  return {
    ROLES: {
      ADMIN: "admin",
      MANAGER: "manager",
      USER: "user",
      AUDITOR: "auditor",
      INVENTORY_MANAGER: "inventory_manager",
    },
    ROLES_HIERARCHY: {
      admin: 4,
      manager: 3,
      auditor: 2,
      inventory_manager: 2,
      user: 1,
    },
  };
});
describe("Database Security Service", function () {
  beforeEach(function () {
    jest.clearAllMocks();
    // Clear in-memory attempts
    databaseSecurity_service_js_1.default._unauthorizedAttempts = [];
  });
  describe("Permission Checking", function () {
    it("should allow admin full access", function () {
      var adminUser = { id: 1, role: "admin", currentCompanyId: "company1" };
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          adminUser,
          "accounts",
          "read",
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          adminUser,
          "accounts",
          "write",
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          adminUser,
          "accounts",
          "delete",
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          adminUser,
          "users",
          "write",
        ),
      ).toBe(true);
    });
    it("should allow managers appropriate access", function () {
      var managerUser = {
        id: 2,
        role: "manager",
        currentCompanyId: "company1",
      };
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          managerUser,
          "accounts",
          "read",
          { companyId: "company1" },
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          managerUser,
          "accounts",
          "write",
          { companyId: "company1" },
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          managerUser,
          "accounts",
          "delete",
          { companyId: "company1" },
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          managerUser,
          "users",
          "write",
        ),
      ).toBe(false);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          managerUser,
          "users",
          "read",
        ),
      ).toBe(true);
    });
    it("should allow users limited access", function () {
      var regularUser = { id: 3, role: "user", currentCompanyId: "company1" };
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          regularUser,
          "accounts",
          "read",
          { companyId: "company1" },
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          regularUser,
          "accounts",
          "write",
        ),
      ).toBe(false);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          regularUser,
          "transactions",
          "read",
          { companyId: "company1" },
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          regularUser,
          "transactions",
          "write",
        ),
      ).toBe(false);
    });
    it("should enforce company ownership for accounts", function () {
      var user = { id: 4, role: "user", currentCompanyId: "company1" };
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          user,
          "accounts",
          "read",
          { companyId: "company1" },
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          user,
          "accounts",
          "read",
          { companyId: "company2" },
        ),
      ).toBe(false);
    });
    it("should reject unauthenticated users", function () {
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          null,
          "accounts",
          "read",
        ),
      ).toBe(false);
      expect(
        databaseSecurity_service_js_1.default.hasPermission(
          undefined,
          "accounts",
          "read",
        ),
      ).toBe(false);
    });
  });
  describe("Unauthorized Access Logging", function () {
    it("should log unauthorized access attempts", function () {
      var attempt = {
        userId: 1,
        userRole: "user",
        resource: "accounts",
        action: "write",
        ip: "127.0.0.1",
        userAgent: "test-agent",
      };
      databaseSecurity_service_js_1.default.logUnauthorizedAccess(attempt);
      var attempts =
        databaseSecurity_service_js_1.default.getUnauthorizedAttempts();
      expect(attempts).toHaveLength(1);
      expect(attempts[0]).toMatchObject(attempt);
      expect(attempts[0].timestamp).toBeDefined();
    });
    it("should limit stored attempts to 100", function () {
      // Add 101 attempts
      for (var i = 0; i < 101; i++) {
        databaseSecurity_service_js_1.default.logUnauthorizedAccess({
          userId: i,
          userRole: "user",
          resource: "accounts",
          action: "write",
          ip: "127.0.0.1",
          userAgent: "test-agent",
        });
      }
      var attempts =
        databaseSecurity_service_js_1.default.getUnauthorizedAttempts();
      // Should keep only last 100 entries (removes first 1)
      expect(attempts).toHaveLength(100);
      // Should contain the last entry (userId = 100)
      expect(attempts[attempts.length - 1].userId).toBe(100);
    });
    it("should block users after too many attempts", function () {
      // Add 11 attempts from same user/IP
      for (var i = 0; i < 11; i++) {
        databaseSecurity_service_js_1.default.logUnauthorizedAccess({
          userId: 1,
          userRole: "user",
          resource: "accounts",
          action: "write",
          ip: "127.0.0.1",
          userAgent: "test-agent",
          timestamp: new Date().toISOString(),
        });
      }
      expect(
        databaseSecurity_service_js_1.default.isBlocked(1, "127.0.0.1"),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.isBlocked(2, "127.0.0.2"),
      ).toBe(false);
    });
  });
  describe("Sensitive Field Access", function () {
    it("should allow admin access to all sensitive fields", function () {
      var admin = { role: "admin" };
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          admin,
          "password",
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          admin,
          "email",
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          admin,
          "salary",
        ),
      ).toBe(true);
    });
    it("should restrict user access to sensitive fields", function () {
      var user = { role: "user" };
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          user,
          "password",
        ),
      ).toBe(false);
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          user,
          "email",
        ),
      ).toBe(false);
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          user,
          "salary",
        ),
      ).toBe(false);
    });
    it("should allow managers access to some sensitive fields", function () {
      var manager = { role: "manager" };
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          manager,
          "password",
        ),
      ).toBe(false);
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          manager,
          "email",
        ),
      ).toBe(true);
      expect(
        databaseSecurity_service_js_1.default.canAccessSensitiveField(
          manager,
          "salary",
        ),
      ).toBe(true);
    });
  });
  describe("Row-Level Security Filters", function () {
    it("should return empty filter for admin", function () {
      var admin = { id: 1, role: "admin", currentCompanyId: "company1" };
      expect(
        databaseSecurity_service_js_1.default.getRowLevelSecurityFilter(
          admin,
          "Account",
        ),
      ).toEqual({});
      expect(
        databaseSecurity_service_js_1.default.getRowLevelSecurityFilter(
          admin,
          "Transaction",
        ),
      ).toEqual({});
    });
    it("should return company filter for non-admin users", function () {
      var user = {
        id: 2,
        role: "user",
        currentCompanyId: "company1",
        tenantId: "tenant1",
      };
      expect(
        databaseSecurity_service_js_1.default.getRowLevelSecurityFilter(
          user,
          "Account",
        ),
      ).toEqual({
        companyId: "company1",
      });
      expect(
        databaseSecurity_service_js_1.default.getRowLevelSecurityFilter(
          user,
          "InventoryItem",
        ),
      ).toEqual({
        tenantId: "tenant1",
      });
    });
    it("should throw error for unauthenticated users", function () {
      expect(function () {
        databaseSecurity_service_js_1.default.getRowLevelSecurityFilter(
          null,
          "Account",
        );
      }).toThrow("User authentication required");
    });
  });
  describe("Database Constraint Validation", function () {
    it("should validate email format", function () {
      var result = databaseSecurity_service_js_1.default.validateConstraints(
        "User",
        { email: "invalid-email" },
        "create",
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid email format");
    });
    it("should validate account code format", function () {
      var result = databaseSecurity_service_js_1.default.validateConstraints(
        "Account",
        { code: "abc" },
        "create",
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Account code must be 3-10 uppercase alphanumeric characters",
      );
    });
    it("should validate SKU format", function () {
      var result = databaseSecurity_service_js_1.default.validateConstraints(
        "InventoryItem",
        { sku: "invalid sku" },
        "create",
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "SKU must be 3-20 uppercase alphanumeric characters with hyphens",
      );
    });
    it("should prevent deletion of records with dependencies", function () {
      var userResult =
        databaseSecurity_service_js_1.default.validateConstraints(
          "User",
          {},
          "delete",
        );
      expect(userResult.isValid).toBe(false);
      expect(userResult.errors).toContain(
        "Cannot delete user with existing records",
      );
      var accountResult =
        databaseSecurity_service_js_1.default.validateConstraints(
          "Account",
          {},
          "delete",
        );
      expect(accountResult.isValid).toBe(false);
      expect(accountResult.errors).toContain(
        "Cannot delete account with existing transactions",
      );
    });
  });
});
describe("Database Security Middleware", function () {
  var app;
  beforeEach(function () {
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mock authentication middleware
    var mockAuth = function (req, res, next) {
      if (req.headers.authorization) {
        req.user = { id: 1, role: "admin", currentCompanyId: "company1" };
      }
      next();
    };
    // Add test routes with security middleware
    app.get(
      "/accounts",
      mockAuth,
      (0, databaseSecurity_middleware_js_1.requireDatabasePermission)(
        "accounts",
        "read",
      ),
      function (req, res) {
        return res.json({ message: "accounts accessed" });
      },
    );
    app.post(
      "/accounts",
      mockAuth,
      (0, databaseSecurity_middleware_js_1.requireDatabasePermission)(
        "accounts",
        "write",
      ),
      (0, databaseSecurity_middleware_js_1.validateDatabaseConstraints)(
        "Account",
        "create",
      ),
      function (req, res) {
        return res.json({ message: "account created" });
      },
    );
    app.post(
      "/sensitive",
      mockAuth,
      databaseSecurity_middleware_js_1.validateSensitiveFieldAccess,
      function (req, res) {
        return res.json({ message: "sensitive data processed" });
      },
    );
  });
  describe("Permission Middleware", function () {
    it("should allow access with proper permissions", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app)
                  .get("/accounts")
                  .set("Authorization", "Bearer token"),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(200);
              expect(response.body.message).toBe("accounts accessed");
              return [2 /*return*/];
          }
        });
      });
    });
    it("should reject access without authentication", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app).get("/accounts"),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(401);
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Sensitive Field Validation", function () {
    it("should allow sensitive fields for admin users", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app)
                  .post("/sensitive")
                  .set("Authorization", "Bearer token")
                  .send({ password: "secret123", email: "test@example.com" }),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(200);
              return [2 /*return*/];
          }
        });
      });
    });
    it("should reject requests without authentication", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app)
                  .post("/sensitive")
                  .send({ password: "secret123", email: "test@example.com" }),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(401);
              return [2 /*return*/];
          }
        });
      });
    });
  });
});
describe("Database Constraints Service", function () {
  // Import after mocking
  var PrismaClient = require("@prisma/client").PrismaClient;
  var mockPrisma;
  beforeEach(function () {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    // Ensure all required methods are properly mocked
    mockPrisma.user = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    };
    mockPrisma.account = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    };
    mockPrisma.refreshToken = {
      count: jest.fn(),
    };
    mockPrisma.transaction = {
      count: jest.fn(),
    };
    // Inject the mock Prisma client
    var DatabaseConstraintsService =
      require("../../services/databaseConstraints.service.js").default;
    DatabaseConstraintsService.setPrismaInstance(mockPrisma);
  });
  describe("Unique Constraint Validation", function () {
    it("should detect duplicate emails", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              // Mock the Prisma client methods
              mockPrisma.user.findFirst = jest
                .fn()
                .mockResolvedValue({ id: 1, email: "test@example.com" });
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateUniqueConstraints("User", {
                  email: "test@example.com",
                }),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors).toContain("Email already exists");
              return [2 /*return*/];
          }
        });
      });
    });
    it("should detect duplicate account codes in same company", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              mockPrisma.account.findFirst = jest
                .fn()
                .mockResolvedValue({
                  id: 1,
                  code: "CASH",
                  companyId: "company1",
                });
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateUniqueConstraints(
                  "Account",
                  {
                    code: "CASH",
                    companyId: "company1",
                  },
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors).toContain(
                "Account code already exists in this company",
              );
              return [2 /*return*/];
          }
        });
      });
    });
    it("should allow duplicate account codes in different companies", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              mockPrisma.account.findFirst = jest.fn().mockResolvedValue(null);
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateUniqueConstraints(
                  "Account",
                  {
                    code: "CASH",
                    companyId: "company2",
                  },
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(true);
              expect(result.errors).toHaveLength(0);
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Foreign Key Constraint Validation", function () {
    it("should detect invalid parent account", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              mockPrisma.account.findUnique = jest.fn().mockResolvedValue(null);
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateForeignKeyConstraints(
                  "Account",
                  {
                    parentId: "invalid-id",
                    companyId: "company1",
                  },
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors).toContain("Parent account not found");
              return [2 /*return*/];
          }
        });
      });
    });
    it("should detect parent account from different company", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              mockPrisma.account.findUnique = jest.fn().mockResolvedValue({
                id: "parent-id",
                companyId: "company2",
              });
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateForeignKeyConstraints(
                  "Account",
                  {
                    parentId: "parent-id",
                    companyId: "company1",
                  },
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors).toContain(
                "Parent account must belong to the same company",
              );
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Business Rules Validation", function () {
    it("should prevent self-referencing account hierarchy", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateBusinessRules(
                  "Account",
                  {
                    id: "account-id",
                    parentId: "account-id",
                  },
                  "create",
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors).toContain(
                "Account cannot be its own parent",
              );
              return [2 /*return*/];
          }
        });
      });
    });
    it("should enforce password strength requirements", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateBusinessRules(
                  "User",
                  {
                    password: "weak",
                  },
                  "create",
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors).toContain(
                "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
              );
              return [2 /*return*/];
          }
        });
      });
    });
    it("should prevent negative inventory quantities", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateBusinessRules(
                  "InventoryItem",
                  {
                    quantity: -5,
                  },
                  "create",
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors).toContain("Quantity cannot be negative");
              return [2 /*return*/];
          }
        });
      });
    });
    it("should enforce selling price >= cost price", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validateBusinessRules(
                  "InventoryItem",
                  {
                    costPrice: 100,
                    sellingPrice: 80,
                  },
                  "create",
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors).toContain(
                "Selling price must be greater than or equal to cost price",
              );
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Comprehensive Validation", function () {
    it("should perform all validation types", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var DatabaseConstraintsService, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Mock all constraint checks to fail
              mockPrisma.user.findFirst = jest
                .fn()
                .mockResolvedValue({ id: 1, email: "test@example.com" });
              mockPrisma.account.findUnique = jest.fn().mockResolvedValue(null);
              DatabaseConstraintsService =
                require("../../services/databaseConstraints.service.js").default;
              return [
                4 /*yield*/,
                DatabaseConstraintsService.validate(
                  "User",
                  {
                    email: "test@example.com",
                    password: "weak",
                  },
                  "create",
                ),
              ];
            case 1:
              result = _a.sent();
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              return [2 /*return*/];
          }
        });
      });
    });
  });
});
