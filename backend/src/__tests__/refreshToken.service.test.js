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
var client_1 = require("@prisma/client");
var refreshToken_service_js_1 = require("../services/refreshToken.service.js");
var prisma = new client_1.PrismaClient();
(0, globals_1.describe)("RefreshTokenService", function () {
  var testUser;
  var testUserId;
  (0, globals_1.beforeEach)(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma.user.create({
                data: {
                  name: "Test User",
                  email: "test-".concat(Date.now(), "@example.com"),
                  password: "hashedpassword",
                  role: "USER",
                },
              }),
            ];
          case 1:
            // Create a test user
            testUser = _a.sent();
            testUserId = testUser.id;
            // Clean up any existing refresh tokens for this user
            return [
              4 /*yield*/,
              prisma.refreshToken.deleteMany({ where: { userId: testUserId } }),
            ];
          case 2:
            // Clean up any existing refresh tokens for this user
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  (0, globals_1.afterEach)(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            // Clean up refresh tokens
            return [
              4 /*yield*/,
              prisma.refreshToken.deleteMany({ where: { userId: testUserId } }),
            ];
          case 1:
            // Clean up refresh tokens
            _a.sent();
            // Clean up test user
            return [
              4 /*yield*/,
              prisma.user.delete({ where: { id: testUserId } }),
            ];
          case 2:
            // Clean up test user
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
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
  });
  (0, globals_1.describe)("createRefreshToken", function () {
    (0, globals_1.it)("should create a refresh token for user", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var token, tokenHash, storedToken;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 1:
              token = _a.sent();
              (0, globals_1.expect)(token).toBeDefined();
              (0, globals_1.expect)(typeof token).toBe("string");
              (0, globals_1.expect)(token).toHaveLength(128);
              tokenHash =
                refreshToken_service_js_1.RefreshTokenService.hashToken(token);
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({
                  where: { tokenHash: tokenHash },
                }),
              ];
            case 2:
              storedToken = _a.sent();
              (0, globals_1.expect)(storedToken).toBeTruthy();
              (0, globals_1.expect)(
                storedToken === null || storedToken === void 0
                  ? void 0
                  : storedToken.userId,
              ).toBe(testUserId);
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)(
      "should invalidate existing tokens when creating new one",
      function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var token1, hash1, storedToken, token2, hash2;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [
                  4 /*yield*/,
                  refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                    testUserId,
                  ),
                ];
              case 1:
                token1 = _a.sent();
                hash1 =
                  refreshToken_service_js_1.RefreshTokenService.hashToken(
                    token1,
                  );
                return [
                  4 /*yield*/,
                  prisma.refreshToken.findUnique({
                    where: { tokenHash: hash1 },
                  }),
                ];
              case 2:
                storedToken = _a.sent();
                (0, globals_1.expect)(storedToken).toBeTruthy();
                return [
                  4 /*yield*/,
                  refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                    testUserId,
                  ),
                ];
              case 3:
                token2 = _a.sent();
                return [
                  4 /*yield*/,
                  prisma.refreshToken.findUnique({
                    where: { tokenHash: hash1 },
                  }),
                ];
              case 4:
                // First token should be invalidated
                storedToken = _a.sent();
                (0, globals_1.expect)(storedToken).toBeFalsy();
                hash2 =
                  refreshToken_service_js_1.RefreshTokenService.hashToken(
                    token2,
                  );
                return [
                  4 /*yield*/,
                  prisma.refreshToken.findUnique({
                    where: { tokenHash: hash2 },
                  }),
                ];
              case 5:
                storedToken = _a.sent();
                (0, globals_1.expect)(storedToken).toBeTruthy();
                return [2 /*return*/];
            }
          });
        });
      },
    );
    (0, globals_1.it)("should set correct expiry date", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var token, tokenHash, storedToken, expectedExpiry, timeDiff;
        var _a;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 1:
              token = _b.sent();
              tokenHash =
                refreshToken_service_js_1.RefreshTokenService.hashToken(token);
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({
                  where: { tokenHash: tokenHash },
                }),
              ];
            case 2:
              storedToken = _b.sent();
              expectedExpiry = new Date();
              expectedExpiry.setDate(
                expectedExpiry.getDate() +
                  refreshToken_service_js_1.RefreshTokenService.getRefreshTokenExpiry(),
              );
              timeDiff = Math.abs(
                (((_a =
                  storedToken === null || storedToken === void 0
                    ? void 0
                    : storedToken.expiresAt) === null || _a === void 0
                  ? void 0
                  : _a.getTime()) || 0) - expectedExpiry.getTime(),
              );
              (0, globals_1.expect)(timeDiff).toBeLessThan(60000); // Less than 1 minute
              return [2 /*return*/];
          }
        });
      });
    });
  });
  (0, globals_1.describe)("verifyRefreshToken", function () {
    (0, globals_1.it)("should verify a valid token", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var token, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 1:
              token = _a.sent();
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.verifyRefreshToken(
                  token,
                ),
              ];
            case 2:
              result = _a.sent();
              (0, globals_1.expect)(result.userId).toBe(testUserId);
              (0, globals_1.expect)(result.user).toBeTruthy();
              (0, globals_1.expect)(result.user.id).toBe(testUserId);
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)("should reject invalid token", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                (0, globals_1.expect)(
                  refreshToken_service_js_1.RefreshTokenService.verifyRefreshToken(
                    "invalid-token",
                  ),
                ).rejects.toThrow("Invalid refresh token"),
              ];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)("should reject expired token", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var token, tokenHash, storedToken;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 1:
              token = _a.sent();
              tokenHash =
                refreshToken_service_js_1.RefreshTokenService.hashToken(token);
              // Manually set expiry to past
              return [
                4 /*yield*/,
                prisma.refreshToken.update({
                  where: { tokenHash: tokenHash },
                  data: { expiresAt: new Date(Date.now() - 1000) }, // 1 second ago
                }),
              ];
            case 2:
              // Manually set expiry to past
              _a.sent();
              return [
                4 /*yield*/,
                (0, globals_1.expect)(
                  refreshToken_service_js_1.RefreshTokenService.verifyRefreshToken(
                    token,
                  ),
                ).rejects.toThrow("Refresh token expired"),
              ];
            case 3:
              _a.sent();
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({
                  where: { tokenHash: tokenHash },
                }),
              ];
            case 4:
              storedToken = _a.sent();
              (0, globals_1.expect)(storedToken).toBeFalsy();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  (0, globals_1.describe)("rotateRefreshToken", function () {
    (0, globals_1.it)("should rotate a valid token", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var oldToken, oldHash, newToken, oldStored, result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 1:
              oldToken = _a.sent();
              oldHash =
                refreshToken_service_js_1.RefreshTokenService.hashToken(
                  oldToken,
                );
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.rotateRefreshToken(
                  oldToken,
                ),
              ];
            case 2:
              newToken = _a.sent();
              (0, globals_1.expect)(newToken).toBeDefined();
              (0, globals_1.expect)(newToken).not.toBe(oldToken);
              (0, globals_1.expect)(typeof newToken).toBe("string");
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({
                  where: { tokenHash: oldHash },
                }),
              ];
            case 3:
              oldStored = _a.sent();
              (0, globals_1.expect)(oldStored).toBeFalsy();
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.verifyRefreshToken(
                  newToken,
                ),
              ];
            case 4:
              result = _a.sent();
              (0, globals_1.expect)(result.userId).toBe(testUserId);
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)("should reject rotation of invalid token", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                (0, globals_1.expect)(
                  refreshToken_service_js_1.RefreshTokenService.rotateRefreshToken(
                    "invalid-token",
                  ),
                ).rejects.toThrow("Invalid refresh token"),
              ];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  (0, globals_1.describe)("invalidateUserRefreshTokens", function () {
    (0, globals_1.it)("should invalidate all user tokens", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var token1, token2, hash1, hash2, _a, _b, _c, _d;
        return __generator(this, function (_e) {
          switch (_e.label) {
            case 0:
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 1:
              token1 = _e.sent();
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 2:
              token2 = _e.sent();
              hash1 =
                refreshToken_service_js_1.RefreshTokenService.hashToken(token1);
              hash2 =
                refreshToken_service_js_1.RefreshTokenService.hashToken(token2);
              // Verify tokens exist
              _a = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({ where: { tokenHash: hash1 } }),
              ];
            case 3:
              // Verify tokens exist
              _a.apply(void 0, [_e.sent()]).toBeTruthy();
              _b = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } }),
              ];
            case 4:
              _b.apply(void 0, [_e.sent()]).toBeTruthy();
              // Invalidate all tokens
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.invalidateUserRefreshTokens(
                  testUserId,
                ),
              ];
            case 5:
              // Invalidate all tokens
              _e.sent();
              // All tokens should be gone
              _c = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({ where: { tokenHash: hash1 } }),
              ];
            case 6:
              // All tokens should be gone
              _c.apply(void 0, [_e.sent()]).toBeFalsy();
              _d = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } }),
              ];
            case 7:
              _d.apply(void 0, [_e.sent()]).toBeFalsy();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  (0, globals_1.describe)("invalidateRefreshToken", function () {
    (0, globals_1.it)("should invalidate specific token", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var token1, token2, hash1, hash2, _a, _b, _c, _d;
        return __generator(this, function (_e) {
          switch (_e.label) {
            case 0:
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 1:
              token1 = _e.sent();
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 2:
              token2 = _e.sent();
              hash1 =
                refreshToken_service_js_1.RefreshTokenService.hashToken(token1);
              hash2 =
                refreshToken_service_js_1.RefreshTokenService.hashToken(token2);
              // Verify tokens exist
              _a = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({ where: { tokenHash: hash1 } }),
              ];
            case 3:
              // Verify tokens exist
              _a.apply(void 0, [_e.sent()]).toBeTruthy();
              _b = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } }),
              ];
            case 4:
              _b.apply(void 0, [_e.sent()]).toBeTruthy();
              // Invalidate only token1
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.invalidateRefreshToken(
                  token1,
                ),
              ];
            case 5:
              // Invalidate only token1
              _e.sent();
              // Only token1 should be gone
              _c = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({ where: { tokenHash: hash1 } }),
              ];
            case 6:
              // Only token1 should be gone
              _c.apply(void 0, [_e.sent()]).toBeFalsy();
              _d = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({ where: { tokenHash: hash2 } }),
              ];
            case 7:
              _d.apply(void 0, [_e.sent()]).toBeTruthy();
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)("should throw error for non-existent token", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                (0, globals_1.expect)(
                  refreshToken_service_js_1.RefreshTokenService.invalidateRefreshToken(
                    "non-existent-token",
                  ),
                ).rejects.toThrow("Refresh token not found"),
              ];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  (0, globals_1.describe)("cleanupExpiredTokens", function () {
    (0, globals_1.it)("should clean up expired tokens", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var token, tokenHash, validToken, validHash, deletedCount, _a, _b;
        return __generator(this, function (_c) {
          switch (_c.label) {
            case 0:
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 1:
              token = _c.sent();
              tokenHash =
                refreshToken_service_js_1.RefreshTokenService.hashToken(token);
              return [
                4 /*yield*/,
                prisma.refreshToken.update({
                  where: { tokenHash: tokenHash },
                  data: { expiresAt: new Date(Date.now() - 1000) },
                }),
              ];
            case 2:
              _c.sent();
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.createRefreshToken(
                  testUserId,
                ),
              ];
            case 3:
              validToken = _c.sent();
              validHash =
                refreshToken_service_js_1.RefreshTokenService.hashToken(
                  validToken,
                );
              return [
                4 /*yield*/,
                refreshToken_service_js_1.RefreshTokenService.cleanupExpiredTokens(),
              ];
            case 4:
              deletedCount = _c.sent();
              (0, globals_1.expect)(deletedCount).toBe(1);
              // Expired token should be gone
              _a = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({
                  where: { tokenHash: tokenHash },
                }),
              ];
            case 5:
              // Expired token should be gone
              _a.apply(void 0, [_c.sent()]).toBeFalsy();
              // Valid token should remain
              _b = globals_1.expect;
              return [
                4 /*yield*/,
                prisma.refreshToken.findUnique({
                  where: { tokenHash: validHash },
                }),
              ];
            case 6:
              // Valid token should remain
              _b.apply(void 0, [_c.sent()]).toBeTruthy();
              return [2 /*return*/];
          }
        });
      });
    });
    (0, globals_1.it)(
      "should return 0 when no expired tokens exist",
      function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var deletedCount;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [
                  4 /*yield*/,
                  refreshToken_service_js_1.RefreshTokenService.cleanupExpiredTokens(),
                ];
              case 1:
                deletedCount = _a.sent();
                (0, globals_1.expect)(deletedCount).toBe(0);
                return [2 /*return*/];
            }
          });
        });
      },
    );
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
});
