"use strict";
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null",
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
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
// Mock Prisma client first
var mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};
// Mock the prisma module
jest.mock("../utils/prisma", function () {
  return {
    prisma: mockPrisma,
  };
});
// Mock bcrypt
var mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};
jest.mock("bcryptjs", function () {
  return mockBcrypt;
});
// Mock jsonwebtoken
var mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
};
jest.mock("jsonwebtoken", function () {
  return mockJwt;
});
// Mock ApiError
var ApiError = /** @class */ (function (_super) {
  __extends(ApiError, _super);
  function ApiError(statusCode, message) {
    var _this = _super.call(this, message) || this;
    _this.statusCode = statusCode;
    _this.name = "ApiError";
    return _this;
  }
  return ApiError;
})(Error);
jest.mock("../utils/errors", function () {
  return {
    ApiError: ApiError,
  };
});
// Import after setting up mocks
var auth_service_1 = require("../services/auth.service");
describe("AuthService", function () {
  var authService;
  beforeEach(function () {
    // Reset all mocks between tests
    jest.clearAllMocks();
    // Set up default mock implementations
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue("hashedPassword");
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue("test-token");
    // Create a fresh instance of AuthService for each test
    authService = new auth_service_1.AuthService();
  });
  afterAll(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            // Clean up after all tests
            return [4 /*yield*/, mockPrisma.$disconnect()];
          case 1:
            // Clean up after all tests
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  describe("register", function () {
    it("should register a new user successfully", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var userData, mockUser, result, error_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              console.log(
                "Starting test: should register a new user successfully",
              );
              userData = {
                email: "test@example.com",
                password: "password123",
                name: "Test User",
              };
              console.log("Test data:", userData);
              mockUser = {
                id: "1",
                email: userData.email,
                name: userData.name,
                password: "hashedPassword",
                isActive: true,
                role: "user",
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              mockPrisma.user.create.mockResolvedValueOnce(mockUser);
              // Call the register method
              console.log("Calling authService.register...");
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              return [4 /*yield*/, authService.register(userData)];
            case 2:
              result = _a.sent();
              console.log("authService.register result:", result);
              return [3 /*break*/, 4];
            case 3:
              error_1 = _a.sent();
              console.error("Error in authService.register:", error_1);
              throw error_1;
            case 4:
              // Verify the result
              console.log("Verifying result...");
              expect(result).toHaveProperty("id", "1");
              expect(result).toHaveProperty("email", userData.email);
              expect(result).toHaveProperty("name", userData.name);
              expect(result).not.toHaveProperty("password");
              // Verify the mocks were called correctly
              expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: userData.email },
              });
              expect(mockBcrypt.hash).toHaveBeenCalledWith(
                userData.password,
                10,
              );
              expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: {
                  email: userData.email,
                  password: "hashedPassword",
                  name: userData.name,
                },
              });
              return [2 /*return*/];
          }
        });
      });
    });
  });
});
