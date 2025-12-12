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
exports.getReportStats =
  exports.deleteReport =
  exports.updateReport =
  exports.createReport =
  exports.getReport =
  exports.getAllReports =
    void 0;
var client_1 = require("@prisma/client");
var logger_js_1 = require("../utils/logger.js");
var errorHandler_js_1 = require("../utils/errorHandler.js");
var prisma = new client_1.PrismaClient();
var getAllReports = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var queryObj_1, excludedFields, queryStr, query, reports, error_1;
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
          queryObj_1 = __assign({}, req.query);
          excludedFields = ["page", "sort", "limit", "fields"];
          excludedFields.forEach(function (el) {
            return delete queryObj_1[el];
          });
          queryStr = JSON.stringify(queryObj_1);
          queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, function (match) {
            return "$".concat(match);
          });
          query = {};
          if (queryStr !== "{}") {
            query = { where: JSON.parse(queryStr) };
          }
          // 3) If user is not admin, only show their reports
          if (req.user.role !== client_1.Role.ADMIN) {
            query.where = __assign(__assign({}, query.where), {
              userId: req.user.id,
            });
          }
          return [
            4 /*yield*/,
            prisma.reconciliationReport.findMany(
              __assign(__assign({}, query), {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              }),
            ),
          ];
        case 1:
          reports = _b.sent();
          logger_js_1.logger.info("Reports retrieved", {
            event: "REPORTS_RETRIEVED",
            userId: req.user.id,
            count: reports.length,
            isAdmin: req.user.role === client_1.Role.ADMIN,
          });
          res.status(200).json({
            status: "success",
            results: reports.length,
            data: {
              reports: reports,
            },
          });
          return [3 /*break*/, 3];
        case 2:
          error_1 = _b.sent();
          logger_js_1.logger.error("Failed to retrieve reports", {
            event: "REPORTS_RETRIEVAL_ERROR",
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
exports.getAllReports = getAllReports;
var getReport = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var id, reportId, report, error_2;
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
          reportId = parseInt(id);
          if (isNaN(reportId)) {
            throw new errorHandler_js_1.ApiError(
              "Invalid report ID",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          return [
            4 /*yield*/,
            prisma.reconciliationReport.findUnique({
              where: { id: reportId },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            }),
          ];
        case 1:
          report = _b.sent();
          if (!report) {
            throw new errorHandler_js_1.ApiError(
              "Report not found",
              404,
              errorHandler_js_1.ErrorCodes.NOT_FOUND,
            );
          }
          // Check if user owns the report or is admin
          if (
            report.userId !== req.user.id &&
            req.user.role !== client_1.Role.ADMIN
          ) {
            throw new errorHandler_js_1.ApiError(
              "Access denied",
              403,
              errorHandler_js_1.ErrorCodes.FORBIDDEN,
            );
          }
          logger_js_1.logger.info("Report retrieved", {
            event: "REPORT_RETRIEVED",
            userId: req.user.id,
            reportId: report.id,
            isOwner: report.userId === req.user.id,
          });
          res.status(200).json({
            status: "success",
            data: {
              report: report,
            },
          });
          return [3 /*break*/, 3];
        case 2:
          error_2 = _b.sent();
          logger_js_1.logger.error("Failed to retrieve report", {
            event: "REPORT_RETRIEVAL_ERROR",
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            reportId: req.params.id,
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
exports.getReport = getReport;
var createReport = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, amount, report, error_3;
    var _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          _c.trys.push([0, 2, , 3]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          ((_a = req.body), (title = _a.title), (amount = _a.amount));
          // Basic validation
          if (!title || amount === undefined) {
            throw new errorHandler_js_1.ApiError(
              "Missing required fields",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          return [
            4 /*yield*/,
            prisma.reconciliationReport.create({
              data: {
                title: title,
                amount: parseFloat(amount),
                userId: req.user.id,
              },
            }),
          ];
        case 1:
          report = _c.sent();
          logger_js_1.logger.info("Report created", {
            event: "REPORT_CREATED",
            userId: req.user.id,
            reportId: report.id,
            title: report.title,
            amount: report.amount,
          });
          res.status(201).json({
            status: "success",
            data: {
              report: report,
            },
          });
          return [3 /*break*/, 3];
        case 2:
          error_3 = _c.sent();
          logger_js_1.logger.error("Failed to create report", {
            event: "REPORT_CREATION_ERROR",
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            error: error_3.message,
          });
          next(error_3);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.createReport = createReport;
var updateReport = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var id,
      reportId,
      _a,
      title,
      amount,
      existingReport,
      updateData,
      report,
      error_4;
    var _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          _c.trys.push([0, 3, , 4]);
          if (!req.user) {
            throw new errorHandler_js_1.ApiError(
              "Not authenticated",
              401,
              errorHandler_js_1.ErrorCodes.UNAUTHORIZED,
            );
          }
          id = req.params.id;
          reportId = parseInt(id);
          ((_a = req.body), (title = _a.title), (amount = _a.amount));
          if (isNaN(reportId)) {
            throw new errorHandler_js_1.ApiError(
              "Invalid report ID",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          return [
            4 /*yield*/,
            prisma.reconciliationReport.findUnique({
              where: { id: reportId },
            }),
          ];
        case 1:
          existingReport = _c.sent();
          if (!existingReport) {
            throw new errorHandler_js_1.ApiError(
              "Report not found",
              404,
              errorHandler_js_1.ErrorCodes.NOT_FOUND,
            );
          }
          // Only admin or report owner can update
          if (
            existingReport.userId !== req.user.id &&
            req.user.role !== client_1.Role.ADMIN
          ) {
            throw new errorHandler_js_1.ApiError(
              "Access denied",
              403,
              errorHandler_js_1.ErrorCodes.FORBIDDEN,
            );
          }
          updateData = {};
          if (title !== undefined) updateData.title = title;
          if (amount !== undefined) updateData.amount = parseFloat(amount);
          return [
            4 /*yield*/,
            prisma.reconciliationReport.update({
              where: { id: reportId },
              data: updateData,
            }),
          ];
        case 2:
          report = _c.sent();
          logger_js_1.logger.info("Report updated", {
            event: "REPORT_UPDATED",
            userId: req.user.id,
            reportId: report.id,
            updatedFields: Object.keys(updateData),
          });
          res.status(200).json({
            status: "success",
            data: {
              report: report,
            },
          });
          return [3 /*break*/, 4];
        case 3:
          error_4 = _c.sent();
          logger_js_1.logger.error("Failed to update report", {
            event: "REPORT_UPDATE_ERROR",
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            reportId: req.params.id,
            error: error_4.message,
          });
          next(error_4);
          return [3 /*break*/, 4];
        case 4:
          return [2 /*return*/];
      }
    });
  });
};
exports.updateReport = updateReport;
var deleteReport = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var id, reportId, existingReport, error_5;
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
          id = req.params.id;
          reportId = parseInt(id);
          if (isNaN(reportId)) {
            throw new errorHandler_js_1.ApiError(
              "Invalid report ID",
              400,
              errorHandler_js_1.ErrorCodes.VALIDATION_ERROR,
            );
          }
          return [
            4 /*yield*/,
            prisma.reconciliationReport.findUnique({
              where: { id: reportId },
            }),
          ];
        case 1:
          existingReport = _b.sent();
          if (!existingReport) {
            throw new errorHandler_js_1.ApiError(
              "Report not found",
              404,
              errorHandler_js_1.ErrorCodes.NOT_FOUND,
            );
          }
          // Only admin or report owner can delete
          if (
            existingReport.userId !== req.user.id &&
            req.user.role !== client_1.Role.ADMIN
          ) {
            throw new errorHandler_js_1.ApiError(
              "Access denied",
              403,
              errorHandler_js_1.ErrorCodes.FORBIDDEN,
            );
          }
          return [
            4 /*yield*/,
            prisma.reconciliationReport.delete({
              where: { id: reportId },
            }),
          ];
        case 2:
          _b.sent();
          logger_js_1.logger.info("Report deleted", {
            event: "REPORT_DELETED",
            userId: req.user.id,
            reportId: reportId,
          });
          res.status(204).send();
          return [3 /*break*/, 4];
        case 3:
          error_5 = _b.sent();
          logger_js_1.logger.error("Failed to delete report", {
            event: "REPORT_DELETION_ERROR",
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            reportId: req.params.id,
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
exports.deleteReport = deleteReport;
var getReportStats = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var stats, error_6;
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
            prisma.reconciliationReport.groupBy({
              by: ["title"],
              _count: {
                id: true,
              },
              _sum: {
                amount: true,
              },
              where:
                req.user.role === client_1.Role.ADMIN
                  ? {}
                  : { userId: req.user.id },
            }),
          ];
        case 1:
          stats = _b.sent();
          logger_js_1.logger.info("Report stats retrieved", {
            event: "REPORT_STATS_RETRIEVED",
            userId: req.user.id,
            isAdmin: req.user.role === client_1.Role.ADMIN,
          });
          res.status(200).json({
            status: "success",
            data: {
              stats: stats,
            },
          });
          return [3 /*break*/, 3];
        case 2:
          error_6 = _b.sent();
          logger_js_1.logger.error("Failed to retrieve report stats", {
            event: "REPORT_STATS_ERROR",
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error_6.message,
          });
          next(error_6);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.getReportStats = getReportStats;
