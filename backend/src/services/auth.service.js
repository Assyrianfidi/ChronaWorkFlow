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
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService =
  exports.AuthService =
  exports.generateAccessToken =
  exports.UserRole =
    void 0;
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var http_status_codes_1 = require("http-status-codes");
var client_1 = require("@prisma/client");
var config_js_1 = require("../config/config.js");
var errors_js_1 = require("../utils/errors.js");
// Define Role enum to match Prisma schema
var UserRole;
(function (UserRole) {
  UserRole["USER"] = "USER";
  UserRole["ADMIN"] = "ADMIN";
  UserRole["MANAGER"] = "MANAGER";
  UserRole["AUDITOR"] = "AUDITOR";
})(UserRole || (exports.UserRole = UserRole = {}));
var prisma = new client_1.PrismaClient();
// Token expiration times (in seconds)
var ACCESS_TOKEN_EXPIRES_IN = 15 * 60; // 15 minutes
var REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days
// Generate access token
var generateAccessToken = function (user) {
  var _a;
  if (
    !((_a = config_js_1.config.jwt) === null || _a === void 0
      ? void 0
      : _a.secret)
  ) {
    throw new Error("JWT secret is not configured");
  }
  var accessToken = jsonwebtoken_1.default.sign(
    {
      userId: user.id,
      role: user.role,
      type: "access",
    },
    config_js_1.config.jwt.secret,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );
  return {
    accessToken: accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };
};
exports.generateAccessToken = generateAccessToken;
// Generate refresh token
var generateRefreshToken = function (userId) {
  return __awaiter(void 0, void 0, void 0, function () {
    var token, expiresAt;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          if (
            !((_a = config_js_1.config.jwt) === null || _a === void 0
              ? void 0
              : _a.refreshSecret)
          ) {
            throw new Error("JWT refresh secret is not configured");
          }
          token = jsonwebtoken_1.default.sign(
            {
              userId: userId,
              type: "refresh",
            },
            config_js_1.config.jwt.refreshSecret,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
          );
          expiresAt = new Date();
          expiresAt.setSeconds(
            expiresAt.getSeconds() + REFRESH_TOKEN_EXPIRES_IN,
          );
          return [
            4 /*yield*/,
            prisma.refreshToken.create({
              data: {
                tokenHash: token, // Store the token as hash
                userId: userId,
                expiresAt: expiresAt,
              },
            }),
          ];
        case 1:
          _b.sent();
          return [2 /*return*/, token];
      }
    });
  });
};
var AuthService = /** @class */ (function () {
  function AuthService() {}
  /**
   * Register a new user
   */
  AuthService.prototype.register = function (userData) {
    return __awaiter(this, void 0, void 0, function () {
      var existingUser,
        salt,
        hashedPassword,
        user,
        tokens,
        password,
        userWithoutPassword;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma.user.findUnique({
                where: { email: userData.email },
              }),
            ];
          case 1:
            existingUser = _a.sent();
            if (existingUser) {
              throw new errors_js_1.ApiError(
                http_status_codes_1.StatusCodes.BAD_REQUEST,
                "Email is already registered",
              );
            }
            return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
          case 2:
            salt = _a.sent();
            return [
              4 /*yield*/,
              bcryptjs_1.default.hash(userData.password, salt),
            ];
          case 3:
            hashedPassword = _a.sent();
            return [
              4 /*yield*/,
              prisma.user.create({
                data: {
                  email: userData.email,
                  password: hashedPassword,
                  name: userData.name,
                  role: userData.role || UserRole.USER,
                  isActive: true,
                },
              }),
            ];
          case 4:
            user = _a.sent();
            return [4 /*yield*/, this.generateAuthTokens(user.id, user.role)];
          case 5:
            tokens = _a.sent();
            // Update last login
            return [4 /*yield*/, this.updateLastLogin(user.id)];
          case 6:
            // Update last login
            _a.sent();
            ((password = user.password),
              (userWithoutPassword = __rest(user, ["password"])));
            return [
              2 /*return*/,
              { user: userWithoutPassword, tokens: tokens },
            ];
        }
      });
    });
  };
  /**
   * Login user with email and password
   */
  AuthService.prototype.login = function (credentials) {
    return __awaiter(this, void 0, void 0, function () {
      var user, isPasswordValid, tokens, password, userWithoutPassword;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma.user.findUnique({
                where: { email: credentials.email },
              }),
            ];
          case 1:
            user = _a.sent();
            // Check if user exists and is active
            if (!user || !user.isActive) {
              throw new errors_js_1.ApiError(
                http_status_codes_1.StatusCodes.UNAUTHORIZED,
                "Invalid email or password",
              );
            }
            return [
              4 /*yield*/,
              bcryptjs_1.default.compare(credentials.password, user.password),
            ];
          case 2:
            isPasswordValid = _a.sent();
            if (!isPasswordValid) {
              throw new errors_js_1.ApiError(
                http_status_codes_1.StatusCodes.UNAUTHORIZED,
                "Invalid email or password",
              );
            }
            return [4 /*yield*/, this.generateAuthTokens(user.id, user.role)];
          case 3:
            tokens = _a.sent();
            // Update last login
            return [4 /*yield*/, this.updateLastLogin(user.id)];
          case 4:
            // Update last login
            _a.sent();
            ((password = user.password),
              (userWithoutPassword = __rest(user, ["password"])));
            return [
              2 /*return*/,
              { user: userWithoutPassword, tokens: tokens },
            ];
        }
      });
    });
  };
  /**
   * Generate new access and refresh tokens
   */
  AuthService.prototype.generateAuthTokens = function (userId, role) {
    return __awaiter(this, void 0, void 0, function () {
      var userWithRole, _a, accessTokenResult, refreshToken;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            userWithRole = {
              id: userId,
              email: "", // Not needed for token generation
              name: "", // Not needed for token generation
              password: "", // Not needed for token generation
              role: role,
              isActive: true,
              passwordChangedAt: null,
              lastLogin: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              currentCompanyId: null,
              deletedAt: null,
            };
            return [
              4 /*yield*/,
              Promise.all([
                (0, exports.generateAccessToken)(userWithRole),
                generateRefreshToken(userId),
              ]),
            ];
          case 1:
            ((_a = _b.sent()),
              (accessTokenResult = _a[0]),
              (refreshToken = _a[1]));
            return [
              2 /*return*/,
              {
                accessToken: accessTokenResult.accessToken,
                refreshToken: refreshToken,
                expiresIn: accessTokenResult.expiresIn,
              },
            ];
        }
      });
    });
  };
  /**
   * Refresh access token using refresh token
   */
  AuthService.prototype.refreshToken = function (refreshToken) {
    return __awaiter(this, void 0, void 0, function () {
      var decoded, tokenRecord, user, tokens, error_1;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            if (
              !((_a = config_js_1.config.jwt) === null || _a === void 0
                ? void 0
                : _a.refreshSecret)
            ) {
              throw new Error("JWT refresh secret is not configured");
            }
            _b.label = 1;
          case 1:
            _b.trys.push([1, 6, , 9]);
            decoded = jsonwebtoken_1.default.verify(
              refreshToken,
              config_js_1.config.jwt.refreshSecret,
            );
            if (decoded.type !== "refresh") {
              throw new Error("Invalid token type");
            }
            return [
              4 /*yield*/,
              prisma.refreshToken.findFirst({
                where: {
                  tokenHash: refreshToken,
                  expiresAt: { gte: new Date() },
                },
              }),
            ];
          case 2:
            tokenRecord = _b.sent();
            if (!tokenRecord) {
              throw new Error("Invalid or expired refresh token");
            }
            return [
              4 /*yield*/,
              prisma.user.findUnique({
                where: { id: tokenRecord.userId },
              }),
            ];
          case 3:
            user = _b.sent();
            if (!user) {
              throw new Error("User not found");
            }
            return [4 /*yield*/, this.generateAuthTokens(user.id, user.role)];
          case 4:
            tokens = _b.sent();
            // Delete the old refresh token
            return [
              4 /*yield*/,
              prisma.refreshToken.delete({
                where: { id: tokenRecord.id },
              }),
            ];
          case 5:
            // Delete the old refresh token
            _b.sent();
            return [2 /*return*/, tokens];
          case 6:
            error_1 = _b.sent();
            if (!(error_1 instanceof jsonwebtoken_1.default.TokenExpiredError))
              return [3 /*break*/, 8];
            // Clean up expired token
            return [
              4 /*yield*/,
              prisma.refreshToken.deleteMany({
                where: { tokenHash: refreshToken },
              }),
            ];
          case 7:
            // Clean up expired token
            _b.sent();
            throw new errors_js_1.ApiError(
              http_status_codes_1.StatusCodes.UNAUTHORIZED,
              "Refresh token expired",
            );
          case 8:
            throw new errors_js_1.ApiError(
              http_status_codes_1.StatusCodes.UNAUTHORIZED,
              "Invalid refresh token",
            );
          case 9:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Logout user by revoking refresh tokens
   */
  AuthService.prototype.logout = function (refreshToken) {
    return __awaiter(this, void 0, void 0, function () {
      var error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            // Delete the refresh token
            return [
              4 /*yield*/,
              prisma.refreshToken.deleteMany({
                where: { tokenHash: refreshToken },
              }),
            ];
          case 1:
            // Delete the refresh token
            _a.sent();
            return [3 /*break*/, 3];
          case 2:
            error_2 = _a.sent();
            // Log the error but don't fail the request
            console.error("Error during logout:", error_2);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Update user's last login timestamp
   */
  AuthService.prototype.updateLastLogin = function (userId) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma.user.update({
                where: { id: userId },
                data: {
                  lastLogin: new Date(),
                },
              }),
            ];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Change user password
   */
  AuthService.prototype.changePassword = function (
    userId,
    currentPassword,
    newPassword,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var user, isPasswordValid, salt, hashedPassword;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma.user.findUnique({
                where: { id: userId },
              }),
            ];
          case 1:
            user = _a.sent();
            if (!user) {
              throw new errors_js_1.ApiError(
                http_status_codes_1.StatusCodes.NOT_FOUND,
                "User not found",
              );
            }
            return [
              4 /*yield*/,
              bcryptjs_1.default.compare(currentPassword, user.password),
            ];
          case 2:
            isPasswordValid = _a.sent();
            if (!isPasswordValid) {
              throw new errors_js_1.ApiError(
                http_status_codes_1.StatusCodes.UNAUTHORIZED,
                "Current password is incorrect",
              );
            }
            return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
          case 3:
            salt = _a.sent();
            return [4 /*yield*/, bcryptjs_1.default.hash(newPassword, salt)];
          case 4:
            hashedPassword = _a.sent();
            // Update password and set passwordChangedAt
            return [
              4 /*yield*/,
              prisma.user.update({
                where: { id: userId },
                data: {
                  password: hashedPassword,
                  // Using any to bypass the type check for passwordChangedAt
                  // since it's not in the Prisma schema yet
                  passwordChangedAt: new Date(),
                },
              }),
            ];
          case 5:
            // Update password and set passwordChangedAt
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Get current user profile
   */
  AuthService.prototype.getCurrentUser = function (userId) {
    return __awaiter(this, void 0, void 0, function () {
      var user;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma.user.findUnique({
                where: { id: userId },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                  isActive: true,
                  passwordChangedAt: true,
                  lastLogin: true,
                  createdAt: true,
                  updatedAt: true,
                },
              }),
            ];
          case 1:
            user = _a.sent();
            if (!user) {
              throw new errors_js_1.ApiError(
                http_status_codes_1.StatusCodes.NOT_FOUND,
                "User not found",
              );
            }
            return [2 /*return*/, user];
        }
      });
    });
  };
  return AuthService;
})();
exports.AuthService = AuthService;
exports.authService = new AuthService();
