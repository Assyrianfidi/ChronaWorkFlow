"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.logoutAll =
  exports.getCurrentUser =
  exports.changePassword =
  exports.logout =
  exports.refreshToken =
  exports.register =
  exports.login =
    void 0;
var http_status_codes_1 = require("http-status-codes");
var zod_1 = require("zod");
var auth_service_js_1 = require("../services/auth.service.js");
var refreshToken_service_ts_1 = require("../services/refreshToken.service.ts");
var errorHandler_js_1 = require("../utils/errorHandler.js");
var logger_js_1 = require("../utils/logger.js");
var auditLogger_service_js_1 = require("../services/auditLogger.service.js");
// Zod schemas for request validation
var loginSchema = zod_1.z.object({
  email: zod_1.z.string().email("Invalid email format"),
  password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
var registerSchema = zod_1.z.object({
  name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
  email: zod_1.z.string().email("Invalid email format"),
  password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
  role: zod_1.z.nativeEnum(auth_service_js_1.UserRole).optional(),
});
var changePasswordSchema = zod_1.z.object({
  currentPassword: zod_1.z.string().min(8, "Current password is required"),
  newPassword: zod_1.z
    .string()
    .min(8, "New password must be at least 8 characters"),
});
// Set HTTP-only cookie with refresh token
var setRefreshTokenCookie = function (res, token) {
  var maxAge =
    refreshToken_service_ts_1.RefreshTokenService.getRefreshTokenExpiry() *
    24 *
    60 *
    60 *
    1000; // Convert days to milliseconds
  res.cookie(
    "refreshToken",
    token,
    __assign(
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: maxAge,
        path: "/",
      },
      process.env.NODE_ENV === "production" && {
        domain: process.env.COOKIE_DOMAIN,
      },
    ),
  );
};
/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
var login = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, _b, user, tokens, refreshToken_1, error_1;
    var _c, _d;
    return __generator(this, function (_e) {
      switch (_e.label) {
        case 0:
          _e.trys.push([0, 4, , 6]);
          ((_a = loginSchema.parse(req.body)),
            (email = _a.email),
            (password = _a.password));
          return [
            4 /*yield*/,
            auth_service_js_1.authService.login({
              email: email,
              password: password,
            }),
          ];
        case 1:
          ((_b = _e.sent()), (user = _b.user), (tokens = _b.tokens));
          return [
            4 /*yield*/,
            refreshToken_service_ts_1.RefreshTokenService.createRefreshToken(
              user.id,
            ),
          ];
        case 2:
          refreshToken_1 = _e.sent();
          // Set refresh token as HTTP-only cookie
          setRefreshTokenCookie(res, refreshToken_1);
          // Log successful login
          logger_js_1.logger.info(
            "User logged in: "
              .concat(user.email, " (ID: ")
              .concat(user.id, ") from IP: ")
              .concat(req.ip),
          );
          // Audit log successful login
          return [
            4 /*yield*/,
            auditLogger_service_js_1.default.logAuthEvent({
              action: "LOGIN",
              userId: user.id,
              email: user.email,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              success: true,
              details: {
                loginMethod: "password",
                timestamp: new Date(),
              },
              severity: "INFO",
            }),
          ];
        case 3:
          // Audit log successful login
          _e.sent();
          // Return access token and user data
          res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: {
              user: user,
              accessToken: tokens.accessToken,
              expiresIn: tokens.expiresIn,
            },
          });
          return [3 /*break*/, 6];
        case 4:
          error_1 = _e.sent();
          if (error_1 instanceof zod_1.z.ZodError) {
            return [
              2 /*return*/,
              next(
                new errorHandler_js_1.ApiError(
                  "Validation failed",
                  http_status_codes_1.StatusCodes.BAD_REQUEST,
                  errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
                  true,
                  error_1.errors,
                ),
              ),
            ];
          }
          // Log failed login attempt
          logger_js_1.logger.error(
            "Login failed for email: "
              .concat(
                (_c = req.body) === null || _c === void 0 ? void 0 : _c.email,
                " from IP: ",
              )
              .concat(req.ip),
          );
          // Audit log failed login
          return [
            4 /*yield*/,
            auditLogger_service_js_1.default.logAuthEvent({
              action: "LOGIN_FAILED",
              userId: null,
              email:
                (_d = req.body) === null || _d === void 0 ? void 0 : _d.email,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              success: false,
              details: {
                reason: error_1.message || "Invalid credentials",
                timestamp: new Date(),
                bruteForce: true, // Flag for potential brute force
              },
              severity: "WARNING",
            }),
          ];
        case 5:
          // Audit log failed login
          _e.sent();
          next(error_1);
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
      }
    });
  });
};
exports.login = login;
/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
var register = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a,
      name_1,
      email,
      password,
      role,
      _b,
      user,
      tokens,
      refreshToken_2,
      error_2;
    var _c, _d;
    return __generator(this, function (_e) {
      switch (_e.label) {
        case 0:
          _e.trys.push([0, 4, , 6]);
          ((_a = registerSchema.parse(req.body)),
            (name_1 = _a.name),
            (email = _a.email),
            (password = _a.password),
            (role = _a.role));
          return [
            4 /*yield*/,
            auth_service_js_1.authService.register({
              name: name_1,
              email: email,
              password: password,
              role: role,
            }),
          ];
        case 1:
          ((_b = _e.sent()), (user = _b.user), (tokens = _b.tokens));
          return [
            4 /*yield*/,
            refreshToken_service_ts_1.RefreshTokenService.createRefreshToken(
              user.id,
            ),
          ];
        case 2:
          refreshToken_2 = _e.sent();
          // Set refresh token as HTTP-only cookie
          setRefreshTokenCookie(res, refreshToken_2);
          // Log successful registration
          logger_js_1.logger.info(
            "User registered: "
              .concat(user.email, " (ID: ")
              .concat(user.id, ") from IP: ")
              .concat(req.ip),
          );
          // Audit log successful registration
          return [
            4 /*yield*/,
            auditLogger_service_js_1.default.logAuthEvent({
              action: "REGISTER",
              userId: user.id,
              email: user.email,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              success: true,
              details: {
                role: user.role,
                timestamp: new Date(),
              },
              severity: "INFO",
            }),
          ];
        case 3:
          // Audit log successful registration
          _e.sent();
          // Return access token and user data
          res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: {
              user: user,
              accessToken: tokens.accessToken,
              expiresIn: tokens.expiresIn,
            },
          });
          return [3 /*break*/, 6];
        case 4:
          error_2 = _e.sent();
          if (error_2 instanceof zod_1.z.ZodError) {
            return [
              2 /*return*/,
              next(
                new errorHandler_js_1.ApiError(
                  "Validation failed",
                  http_status_codes_1.StatusCodes.BAD_REQUEST,
                  errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
                  true,
                  error_2.errors,
                ),
              ),
            ];
          }
          // Log failed registration
          logger_js_1.logger.error(
            "Registration failed for email: "
              .concat(
                (_c = req.body) === null || _c === void 0 ? void 0 : _c.email,
                " from IP: ",
              )
              .concat(req.ip),
          );
          // Audit log failed registration
          return [
            4 /*yield*/,
            auditLogger_service_js_1.default.logAuthEvent({
              action: "REGISTER_FAILED",
              userId: null,
              email:
                (_d = req.body) === null || _d === void 0 ? void 0 : _d.email,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              success: false,
              details: {
                reason: error_2.message || "Registration failed",
                timestamp: new Date(),
              },
              severity: "WARNING",
            }),
          ];
        case 5:
          // Audit log failed registration
          _e.sent();
          next(error_2);
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
      }
    });
  });
};
exports.register = register;
/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
var refreshToken = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken_3, newRefreshToken, user, tokens, error_3;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          refreshToken_3 = req.cookies.refreshToken;
          if (!refreshToken_3) {
            throw new errorHandler_js_1.ApiError(
              "No refresh token provided",
              http_status_codes_1.StatusCodes.UNAUTHORIZED,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          return [
            4 /*yield*/,
            refreshToken_service_ts_1.RefreshTokenService.rotateRefreshToken(
              refreshToken_3,
            ),
          ];
        case 1:
          newRefreshToken = _a.sent();
          return [
            4 /*yield*/,
            refreshToken_service_ts_1.RefreshTokenService.verifyRefreshToken(
              newRefreshToken,
            ),
          ];
        case 2:
          user = _a.sent().user;
          tokens = (0, auth_service_js_1.generateAccessToken)(user);
          // Set new refresh token as HTTP-only cookie
          setRefreshTokenCookie(res, newRefreshToken);
          // Log token refresh
          logger_js_1.logger.info(
            "Token refreshed for user: "
              .concat(user.email, " (ID: ")
              .concat(user.id, ") from IP: ")
              .concat(req.ip),
          );
          // Return new access token
          res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: {
              accessToken: tokens.accessToken,
              expiresIn: tokens.expiresIn,
            },
          });
          return [3 /*break*/, 4];
        case 3:
          error_3 = _a.sent();
          // Clear invalid refresh token cookie
          res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
          });
          logger_js_1.logger.error(
            "Token refresh failed from IP: ".concat(req.ip),
          );
          next(error_3);
          return [3 /*break*/, 4];
        case 4:
          return [2 /*return*/];
      }
    });
  });
};
exports.refreshToken = refreshToken;
/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
var logout = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken_4, error_4;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
      switch (_e.label) {
        case 0:
          _e.trys.push([0, 4, , 6]);
          refreshToken_4 = req.cookies.refreshToken;
          if (!refreshToken_4) return [3 /*break*/, 2];
          // Invalidate the specific refresh token
          return [
            4 /*yield*/,
            refreshToken_service_ts_1.RefreshTokenService.invalidateRefreshToken(
              refreshToken_4,
            ),
          ];
        case 1:
          // Invalidate the specific refresh token
          _e.sent();
          _e.label = 2;
        case 2:
          // Clear refresh token cookie
          res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
          });
          // Log successful logout
          logger_js_1.logger.info("User logged out from IP: ".concat(req.ip));
          // Audit log successful logout
          return [
            4 /*yield*/,
            auditLogger_service_js_1.default.logAuthEvent({
              action: "LOGOUT",
              userId:
                (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
              email:
                ((_b = req.user) === null || _b === void 0
                  ? void 0
                  : _b.email) || null,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              success: true,
              details: {
                logoutMethod: "explicit",
                timestamp: new Date(),
              },
              severity: "INFO",
            }),
          ];
        case 3:
          // Audit log successful logout
          _e.sent();
          res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
          return [3 /*break*/, 6];
        case 4:
          error_4 = _e.sent();
          logger_js_1.logger.error("Logout failed from IP: ".concat(req.ip));
          // Audit log failed logout
          return [
            4 /*yield*/,
            auditLogger_service_js_1.default.logAuthEvent({
              action: "LOGOUT_FAILED",
              userId:
                (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
              email:
                ((_d = req.user) === null || _d === void 0
                  ? void 0
                  : _d.email) || null,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              success: false,
              details: {
                reason: error_4.message || "Logout failed",
                timestamp: new Date(),
              },
              severity: "WARNING",
            }),
          ];
        case 5:
          // Audit log failed logout
          _e.sent();
          next(error_4);
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
      }
    });
  });
};
exports.logout = logout;
/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
var changePassword = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a, currentPassword, newPassword, error_5;
    var _b, _c;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          _d.trys.push([0, 4, , 6]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              http_status_codes_1.StatusCodes.UNAUTHORIZED,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          ((_a = changePasswordSchema.parse(req.body)),
            (currentPassword = _a.currentPassword),
            (newPassword = _a.newPassword));
          return [
            4 /*yield*/,
            auth_service_js_1.authService.changePassword(
              req.user.id,
              currentPassword,
              newPassword,
            ),
          ];
        case 1:
          _d.sent();
          // Invalidate all refresh tokens for this user when password changes
          return [
            4 /*yield*/,
            refreshToken_service_ts_1.RefreshTokenService.invalidateUserRefreshTokens(
              req.user.id,
            ),
          ];
        case 2:
          // Invalidate all refresh tokens for this user when password changes
          _d.sent();
          // Clear refresh token cookie
          res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
          });
          logger_js_1.logger.info(
            "Password changed for user ID: "
              .concat(req.user.id, " from IP: ")
              .concat(req.ip),
          );
          // Audit log password change
          return [
            4 /*yield*/,
            auditLogger_service_js_1.default.logAuthEvent({
              action: "PASSWORD_CHANGE",
              userId: req.user.id,
              email: req.user.email || null,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              success: true,
              details: {
                timestamp: new Date(),
                allTokensInvalidated: true,
              },
              severity: "INFO",
            }),
          ];
        case 3:
          // Audit log password change
          _d.sent();
          res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
          return [3 /*break*/, 6];
        case 4:
          error_5 = _d.sent();
          if (error_5 instanceof zod_1.z.ZodError) {
            throw new errorHandler_js_1.ApiError(
              "Validation failed",
              http_status_codes_1.StatusCodes.BAD_REQUEST,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
              true,
              error_5.errors,
            );
          }
          // Audit log failed password change
          return [
            4 /*yield*/,
            auditLogger_service_js_1.default.logAuthEvent({
              action: "PASSWORD_CHANGE_FAILED",
              userId:
                (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
              email:
                ((_c = req.user) === null || _c === void 0
                  ? void 0
                  : _c.email) || null,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              success: false,
              details: {
                reason: error_5.message || "Password change failed",
                timestamp: new Date(),
              },
              severity: "WARNING",
            }),
          ];
        case 5:
          // Audit log failed password change
          _d.sent();
          next(error_5);
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
      }
    });
  });
};
exports.changePassword = changePassword;
/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
var getCurrentUser = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var user, error_6;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              http_status_codes_1.StatusCodes.UNAUTHORIZED,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          return [
            4 /*yield*/,
            auth_service_js_1.authService.getCurrentUser(req.user.id),
          ];
        case 1:
          user = _a.sent();
          res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: { user: user },
          });
          return [3 /*break*/, 3];
        case 2:
          error_6 = _a.sent();
          next(error_6);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.getCurrentUser = getCurrentUser;
/**
 * @desc    Logout user from all sessions
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
var logoutAll = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var error_7;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 2, , 3]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              http_status_codes_1.StatusCodes.UNAUTHORIZED,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          // Invalidate all refresh tokens for this user
          return [
            4 /*yield*/,
            refreshToken_service_ts_1.RefreshTokenService.invalidateUserRefreshTokens(
              req.user.id,
            ),
          ];
        case 1:
          // Invalidate all refresh tokens for this user
          _b.sent();
          // Clear refresh token cookie
          res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
          });
          logger_js_1.logger.info(
            "User logged out from all sessions - User ID: "
              .concat(req.user.id, " from IP: ")
              .concat(req.ip),
          );
          res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
          return [3 /*break*/, 3];
        case 2:
          error_7 = _b.sent();
          logger_js_1.logger.error(
            "Logout all sessions failed for user ID: "
              .concat(
                (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                " from IP: ",
              )
              .concat(req.ip),
          );
          next(error_7);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.logoutAll = logoutAll;
