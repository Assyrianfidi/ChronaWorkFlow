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
var globals_1 = require("@jest/globals");
// Mock Prisma Client before importing RefreshTokenService
var mockPrisma = {
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};
jest.mock("@prisma/client", function () {
  return {
    PrismaClient: jest.fn(function () {
      return mockPrisma;
    }),
  };
});
// Mock logger
jest.mock("../utils/logger.ts", function () {
  return {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  };
});
var refreshToken_service_js_1 = require("../services/refreshToken.service.js");
(0, globals_1.describe)("RefreshTokenService - Unit Tests", function () {
  (0, globals_1.beforeEach)(function () {
    jest.clearAllMocks();
  });
  (0, globals_1.describe)("generateRefreshToken", function () {
    (0, globals_1.it)("should generate a token of correct length", function () {
      var token =
        refreshToken_service_js_1.RefreshTokenService.generateRefreshToken();
      (0, globals_1.expect)(token).toHaveLength(128); // 64 bytes = 128 hex characters
    });
    (0, globals_1.it)(
      "should generate different tokens each time",
      function () {
        var token1 =
          refreshToken_service_js_1.RefreshTokenService.generateRefreshToken();
        var token2 =
          refreshToken_service_js_1.RefreshTokenService.generateRefreshToken();
        (0, globals_1.expect)(token1).not.toBe(token2);
      },
    );
    (0, globals_1.it)(
      "should generate tokens with only hex characters",
      function () {
        var token =
          refreshToken_service_js_1.RefreshTokenService.generateRefreshToken();
        (0, globals_1.expect)(/^[0-9a-f]+$/i.test(token)).toBe(true);
      },
    );
  });
  (0, globals_1.describe)("hashToken", function () {
    (0, globals_1.it)("should hash a token consistently", function () {
      var token = "test-token";
      var hash1 =
        refreshToken_service_js_1.RefreshTokenService.hashToken(token);
      var hash2 =
        refreshToken_service_js_1.RefreshTokenService.hashToken(token);
      (0, globals_1.expect)(hash1).toBe(hash2);
    });
    (0, globals_1.it)(
      "should produce different hashes for different tokens",
      function () {
        var token1 = "token1";
        var token2 = "token2";
        var hash1 =
          refreshToken_service_js_1.RefreshTokenService.hashToken(token1);
        var hash2 =
          refreshToken_service_js_1.RefreshTokenService.hashToken(token2);
        (0, globals_1.expect)(hash1).not.toBe(hash2);
      },
    );
    (0, globals_1.it)("should produce hash of correct length", function () {
      var token = "test-token";
      var hash = refreshToken_service_js_1.RefreshTokenService.hashToken(token);
      (0, globals_1.expect)(hash).toHaveLength(64); // SHA256 produces 64 hex characters
    });
  });
  (0, globals_1.describe)("getAccessTokenExpiry", function () {
    (0, globals_1.it)("should return correct expiry time", function () {
      var expiry =
        refreshToken_service_js_1.RefreshTokenService.getAccessTokenExpiry();
      (0, globals_1.expect)(expiry).toBe(15); // 15 minutes
    });
  });
  (0, globals_1.describe)("getRefreshTokenExpiry", function () {
    (0, globals_1.it)("should return correct expiry time", function () {
      var expiry =
        refreshToken_service_js_1.RefreshTokenService.getRefreshTokenExpiry();
      (0, globals_1.expect)(expiry).toBe(30); // 30 days
    });
  });
  (0, globals_1.describe)("Token Security", function () {
    (0, globals_1.it)("should not store plain tokens in database", function () {
      var token =
        refreshToken_service_js_1.RefreshTokenService.generateRefreshToken();
      var hash = refreshToken_service_js_1.RefreshTokenService.hashToken(token);
      (0, globals_1.expect)(token).not.toBe(hash);
      (0, globals_1.expect)(hash).not.toContain(token);
    });
    (0, globals_1.it)(
      "should generate cryptographically secure tokens",
      function () {
        // Generate many tokens and check for uniqueness
        var tokens = new Set();
        for (var i = 0; i < 1000; i++) {
          tokens.add(
            refreshToken_service_js_1.RefreshTokenService.generateRefreshToken(),
          );
        }
        (0, globals_1.expect)(tokens.size).toBe(1000); // All tokens should be unique
      },
    );
  });
  (0, globals_1.describe)("Error Handling", function () {
    (0, globals_1.it)("should handle database errors gracefully", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Mock database error
              mockPrisma.refreshToken.create.mockRejectedValue(
                new Error("Database error"),
              );
              return [
                4 /*yield*/,
                (0, globals_1.expect)(
                  refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                    1,
                  ),
                ).rejects.toThrow("Failed to create refresh token"),
              ];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    });
  });
});
