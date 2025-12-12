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
exports.deleteMe =
  exports.updateMe =
  exports.deleteUser =
  exports.updateUser =
  exports.createUser =
  exports.getUser =
  exports.getAllUsers =
    void 0;
var client_1 = require("@prisma/client");
var logger_js_1 = require("../utils/logger.js");
var errorHandler_js_1 = require("../utils/errorHandler.js");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
var getAllUsers = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var users, error_1;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 2, , 3]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          // Only admins can get all users
          if (req.user.role !== client_1.Role.ADMIN) {
            throw new errorHandler_js_1.ApiError(
              "Access denied",
              403,
              errorHandler_js_1.ErrorCodes.FORBIDDEN,
            );
          }
          return [
            4 /*yield*/,
            prisma.user.findMany({
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
          ];
        case 1:
          users = _b.sent();
          logger_js_1.logger.info("All users retrieved", {
            event: "ALL_USERS_RETRIEVED",
            userId: req.user.id,
            count: users.length,
          });
          res.status(200).json({
            status: "success",
            results: users.length,
            data: {
              users: users,
            },
          });
          return [3 /*break*/, 3];
        case 2:
          error_1 = _b.sent();
          logger_js_1.logger.error("Failed to retrieve all users", {
            event: "ALL_USERS_RETRIEVAL_ERROR",
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error_1.message,
          });
          next(error_1);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.getAllUsers = getAllUsers;
var getUser = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, user, error_2;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 2, , 3]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          id = req.params.id;
          userId = parseInt(id);
          if (isNaN(userId)) {
            throw new errorHandler_js_1.ApiError(
              "Invalid user ID",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          // Users can only get their own profile unless they're admin
          if (userId !== req.user.id && req.user.role !== client_1.Role.ADMIN) {
            throw new errorHandler_js_1.ApiError(
              "Access denied",
              403,
              errorHandler_js_1.ErrorCodes.FORBIDDEN,
            );
          }
          return [
            4 /*yield*/,
            prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLogin: true,
              },
            }),
          ];
        case 1:
          user = _b.sent();
          if (!user) {
            throw new errorHandler_js_1.ApiError(
              "User not found",
              404,
              errorHandler_js_1.ErrorCodes.NOT_FOUND,
            );
          }
          logger_js_1.logger.info("User retrieved", {
            event: "USER_RETRIEVED",
            userId: req.user.id,
            targetUserId: userId,
            isSelf: userId === req.user.id,
          });
          res.status(200).json({
            status: "success",
            data: {
              user: user,
            },
          });
          return [3 /*break*/, 3];
        case 2:
          error_2 = _b.sent();
          logger_js_1.logger.error("Failed to retrieve user", {
            event: "USER_RETRIEVAL_ERROR",
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            targetUserId: req.params.id,
            error: error_2.message,
          });
          next(error_2);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.getUser = getUser;
var createUser = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a,
      name_1,
      email,
      password,
      _b,
      role,
      existingUser,
      salt,
      hashedPassword,
      user,
      error_3;
    var _c;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          _d.trys.push([0, 5, , 6]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          // Only admins can create users
          if (req.user.role !== client_1.Role.ADMIN) {
            throw new errorHandler_js_1.ApiError(
              "Access denied",
              403,
              errorHandler_js_1.ErrorCodes.FORBIDDEN,
            );
          }
          ((_a = req.body),
            (name_1 = _a.name),
            (email = _a.email),
            (password = _a.password),
            (_b = _a.role),
            (role = _b === void 0 ? client_1.Role.USER : _b));
          // Basic validation
          if (!name_1 || !email || !password) {
            throw new errorHandler_js_1.ApiError(
              "Missing required fields",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          return [
            4 /*yield*/,
            prisma.user.findUnique({
              where: { email: email },
            }),
          ];
        case 1:
          existingUser = _d.sent();
          if (existingUser) {
            throw new errorHandler_js_1.ApiError(
              "User already exists",
              400,
              errorHandler_js_1.ErrorCodes.CONFLICT,
            );
          }
          return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
        case 2:
          salt = _d.sent();
          return [4 /*yield*/, bcryptjs_1.default.hash(password, salt)];
        case 3:
          hashedPassword = _d.sent();
          return [
            4 /*yield*/,
            prisma.user.create({
              data: {
                name: name_1,
                email: email,
                password: hashedPassword,
                role: role,
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
          ];
        case 4:
          user = _d.sent();
          logger_js_1.logger.info("User created", {
            event: "USER_CREATED",
            userId: req.user.id,
            newUserId: user.id,
            email: user.email,
            role: user.role,
          });
          res.status(201).json({
            status: "success",
            data: {
              user: user,
            },
          });
          return [3 /*break*/, 6];
        case 5:
          error_3 = _d.sent();
          logger_js_1.logger.error("Failed to create user", {
            event: "USER_CREATION_ERROR",
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
            error: error_3.message,
          });
          next(error_3);
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
      }
    });
  });
};
exports.createUser = createUser;
var updateUser = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var id,
      userId,
      _a,
      name_2,
      email,
      role,
      isActive,
      existingUser,
      updateData,
      emailExists,
      user,
      error_4;
    var _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          _c.trys.push([0, 5, , 6]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          id = req.params.id;
          userId = parseInt(id);
          ((_a = req.body),
            (name_2 = _a.name),
            (email = _a.email),
            (role = _a.role),
            (isActive = _a.isActive));
          if (isNaN(userId)) {
            throw new errorHandler_js_1.ApiError(
              "Invalid user ID",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          // Users can only update their own profile (name, email only) unless they're admin
          if (userId !== req.user.id && req.user.role !== client_1.Role.ADMIN) {
            throw new errorHandler_js_1.ApiError(
              "Access denied",
              403,
              errorHandler_js_1.ErrorCodes.FORBIDDEN,
            );
          }
          return [
            4 /*yield*/,
            prisma.user.findUnique({
              where: { id: userId },
            }),
          ];
        case 1:
          existingUser = _c.sent();
          if (!existingUser) {
            throw new errorHandler_js_1.ApiError(
              "User not found",
              404,
              errorHandler_js_1.ErrorCodes.NOT_FOUND,
            );
          }
          updateData = {};
          // Only admins can update role and isActive
          if (req.user.role === client_1.Role.ADMIN) {
            if (role !== undefined) updateData.role = role;
            if (isActive !== undefined) updateData.isActive = isActive;
          }
          if (!(userId === req.user.id)) return [3 /*break*/, 3];
          if (name_2 !== undefined) updateData.name = name_2;
          if (!(email !== undefined)) return [3 /*break*/, 3];
          return [
            4 /*yield*/,
            prisma.user.findUnique({
              where: { email: email },
            }),
          ];
        case 2:
          emailExists = _c.sent();
          if (emailExists && emailExists.id !== userId) {
            throw new errorHandler_js_1.ApiError(
              "Email already taken",
              400,
              errorHandler_js_1.ErrorCodes.CONFLICT,
            );
          }
          updateData.email = email;
          _c.label = 3;
        case 3:
          return [
            4 /*yield*/,
            prisma.user.update({
              where: { id: userId },
              data: updateData,
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
          ];
        case 4:
          user = _c.sent();
          logger_js_1.logger.info("User updated", {
            event: "USER_UPDATED",
            userId: req.user.id,
            targetUserId: userId,
            updatedFields: Object.keys(updateData),
          });
          res.status(200).json({
            status: "success",
            data: {
              user: user,
            },
          });
          return [3 /*break*/, 6];
        case 5:
          error_4 = _c.sent();
          logger_js_1.logger.error("Failed to update user", {
            event: "USER_UPDATE_ERROR",
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            targetUserId: req.params.id,
            error: error_4.message,
          });
          next(error_4);
          return [3 /*break*/, 6];
        case 6:
          return [2 /*return*/];
      }
    });
  });
};
exports.updateUser = updateUser;
var deleteUser = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, existingUser, error_5;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 3, , 4]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          // Only admins can delete users
          if (req.user.role !== client_1.Role.ADMIN) {
            throw new errorHandler_js_1.ApiError(
              "Access denied",
              403,
              errorHandler_js_1.ErrorCodes.FORBIDDEN,
            );
          }
          id = req.params.id;
          userId = parseInt(id);
          if (isNaN(userId)) {
            throw new errorHandler_js_1.ApiError(
              "Invalid user ID",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          // Prevent self-deletion
          if (userId === req.user.id) {
            throw new errorHandler_js_1.ApiError(
              "Cannot delete your own account",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          return [
            4 /*yield*/,
            prisma.user.findUnique({
              where: { id: userId },
            }),
          ];
        case 1:
          existingUser = _b.sent();
          if (!existingUser) {
            throw new errorHandler_js_1.ApiError(
              "User not found",
              404,
              errorHandler_js_1.ErrorCodes.NOT_FOUND,
            );
          }
          return [
            4 /*yield*/,
            prisma.user.delete({
              where: { id: userId },
            }),
          ];
        case 2:
          _b.sent();
          logger_js_1.logger.info("User deleted", {
            event: "USER_DELETED",
            userId: req.user.id,
            deletedUserId: userId,
            deletedUserEmail: existingUser.email,
          });
          res.status(204).send();
          return [3 /*break*/, 4];
        case 3:
          error_5 = _b.sent();
          logger_js_1.logger.error("Failed to delete user", {
            event: "USER_DELETION_ERROR",
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            targetUserId: req.params.id,
            error: error_5.message,
          });
          next(error_5);
          return [3 /*break*/, 4];
        case 4:
          return [2 /*return*/];
      }
    });
  });
};
exports.deleteUser = deleteUser;
var updateMe = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_3, email, updateData, emailExists, user, error_6;
    var _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          _c.trys.push([0, 4, , 5]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          ((_a = req.body), (name_3 = _a.name), (email = _a.email));
          updateData = {};
          if (name_3 !== undefined) updateData.name = name_3;
          if (!(email !== undefined)) return [3 /*break*/, 2];
          return [
            4 /*yield*/,
            prisma.user.findUnique({
              where: { email: email },
            }),
          ];
        case 1:
          emailExists = _c.sent();
          if (emailExists && emailExists.id !== req.user.id) {
            throw new errorHandler_js_1.ApiError(
              "Email already taken",
              400,
              errorHandler_js_1.ErrorCodes.CONFLICT,
            );
          }
          updateData.email = email;
          _c.label = 2;
        case 2:
          return [
            4 /*yield*/,
            prisma.user.update({
              where: { id: req.user.id },
              data: updateData,
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
          ];
        case 3:
          user = _c.sent();
          logger_js_1.logger.info("User profile updated", {
            event: "USER_PROFILE_UPDATED",
            userId: req.user.id,
            updatedFields: Object.keys(updateData),
          });
          res.status(200).json({
            status: "success",
            data: {
              user: user,
            },
          });
          return [3 /*break*/, 5];
        case 4:
          error_6 = _c.sent();
          logger_js_1.logger.error("Failed to update user profile", {
            event: "USER_PROFILE_UPDATE_ERROR",
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            error: error_6.message,
          });
          next(error_6);
          return [3 /*break*/, 5];
        case 5:
          return [2 /*return*/];
      }
    });
  });
};
exports.updateMe = updateMe;
var deleteMe = function (req, res, next) {
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
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          return [
            4 /*yield*/,
            prisma.user.delete({
              where: { id: req.user.id },
            }),
          ];
        case 1:
          _b.sent();
          logger_js_1.logger.info("User self-deleted", {
            event: "USER_SELF_DELETED",
            userId: req.user.id,
          });
          res.status(204).send();
          return [3 /*break*/, 3];
        case 2:
          error_7 = _b.sent();
          logger_js_1.logger.error("Failed to delete user profile", {
            event: "USER_SELF_DELETION_ERROR",
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error_7.message,
          });
          next(error_7);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.deleteMe = deleteMe;
