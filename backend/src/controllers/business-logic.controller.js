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
exports.healthCheck =
  exports.getTransactionHistory =
  exports.convertCurrency =
  exports.calculateLoanDetails =
  exports.getAccountSummary =
  exports.processTransaction =
    void 0;
var business_logic_service_1 = require("../business-logic/business.logic.service");
var logger_js_1 = require("../utils/logger.js");
/**
 * Business Logic Controller
 * Handles all business logic operations
 */
var processTransaction = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var userId,
      _a,
      fromAccountId,
      toAccountId,
      amount,
      currency,
      description,
      reference,
      metadata,
      context,
      result,
      error_1;
    var _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          _c.trys.push([0, 2, , 3]);
          userId = req.user.id.toString();
          ((_a = req.body),
            (fromAccountId = _a.fromAccountId),
            (toAccountId = _a.toAccountId),
            (amount = _a.amount),
            (currency = _a.currency),
            (description = _a.description),
            (reference = _a.reference),
            (metadata = _a.metadata));
          context = {
            ipAddress: req.ip,
            device: req.headers["user-agent"],
            location: req.headers["x-location"],
            merchantCategory:
              metadata === null || metadata === void 0
                ? void 0
                : metadata.merchantCategory,
          };
          return [
            4 /*yield*/,
            business_logic_service_1.businessLogicService.processTransaction(
              {
                fromAccountId: fromAccountId,
                toAccountId: toAccountId,
                amount: amount,
                currency: currency,
                description: description,
                reference: reference,
                metadata: metadata,
              },
              userId,
              context,
            ),
          ];
        case 1:
          result = _c.sent();
          logger_js_1.logger.info("Transaction processed", {
            event: "TRANSACTION_PROCESSED",
            userId: userId,
            transactionId: result.transactionId,
            success: result.success,
          });
          if (result.success) {
            res.status(201).json({
              success: true,
              data: result,
              message: "Transaction processed successfully",
              warnings: result.warnings,
              fraudAlerts: result.fraudAlerts,
            });
          } else {
            res.status(400).json({
              success: false,
              error: {
                code: "TRANSACTION_FAILED",
                message: result.error || "Transaction processing failed",
              },
            });
          }
          return [3 /*break*/, 3];
        case 2:
          error_1 = _c.sent();
          logger_js_1.logger.error("Transaction processing failed", {
            event: "TRANSACTION_ERROR",
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
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
exports.processTransaction = processTransaction;
var getAccountSummary = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var userId, accountId, summary, error_2;
    var _a;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 2, , 3]);
          userId = req.user.id.toString();
          accountId = req.params.accountId;
          return [
            4 /*yield*/,
            business_logic_service_1.businessLogicService.getAccountSummary(
              accountId,
              userId,
            ),
          ];
        case 1:
          summary = _b.sent();
          logger_js_1.logger.info("Account summary retrieved", {
            event: "ACCOUNT_SUMMARY_RETRIEVED",
            userId: userId,
            accountId: accountId,
            balance: summary.balance,
          });
          res.json({
            success: true,
            data: summary,
          });
          return [3 /*break*/, 3];
        case 2:
          error_2 = _b.sent();
          logger_js_1.logger.error("Account summary retrieval failed", {
            event: "ACCOUNT_SUMMARY_ERROR",
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            accountId: req.params.accountId,
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
exports.getAccountSummary = getAccountSummary;
var calculateLoanDetails = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a, principal, annualRate, months, loanDetails, error_3;
    var _b, _c;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          _d.trys.push([0, 2, , 3]);
          ((_a = req.body),
            (principal = _a.principal),
            (annualRate = _a.annualRate),
            (months = _a.months));
          return [
            4 /*yield*/,
            business_logic_service_1.businessLogicService.calculateLoanDetails(
              principal,
              annualRate,
              months,
            ),
          ];
        case 1:
          loanDetails = _d.sent();
          logger_js_1.logger.info("Loan details calculated", {
            event: "LOAN_DETAILS_CALCULATED",
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            principal: principal,
            annualRate: annualRate,
            months: months,
          });
          res.json({
            success: true,
            data: loanDetails,
          });
          return [3 /*break*/, 3];
        case 2:
          error_3 = _d.sent();
          logger_js_1.logger.error("Loan calculation failed", {
            event: "LOAN_CALCULATION_ERROR",
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
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
exports.calculateLoanDetails = calculateLoanDetails;
var convertCurrency = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var _a, amount, fromCurrency, toCurrency, conversion, error_4;
    var _b, _c;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          _d.trys.push([0, 2, , 3]);
          ((_a = req.body),
            (amount = _a.amount),
            (fromCurrency = _a.fromCurrency),
            (toCurrency = _a.toCurrency));
          return [
            4 /*yield*/,
            business_logic_service_1.businessLogicService.convertCurrency(
              amount,
              fromCurrency,
              toCurrency,
            ),
          ];
        case 1:
          conversion = _d.sent();
          logger_js_1.logger.info("Currency converted", {
            event: "CURRENCY_CONVERTED",
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            amount: amount,
            fromCurrency: fromCurrency,
            toCurrency: toCurrency,
            convertedAmount: conversion.convertedAmount,
          });
          res.json({
            success: true,
            data: conversion,
          });
          return [3 /*break*/, 3];
        case 2:
          error_4 = _d.sent();
          logger_js_1.logger.error("Currency conversion failed", {
            event: "CURRENCY_CONVERSION_ERROR",
            userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
            error: error_4.message,
          });
          next(error_4);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.convertCurrency = convertCurrency;
var getTransactionHistory = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var userId, accountId, _a, _b, limit, _c, offset, history_1, error_5;
    var _d;
    return __generator(this, function (_e) {
      switch (_e.label) {
        case 0:
          _e.trys.push([0, 2, , 3]);
          userId = req.user.id.toString();
          accountId = req.params.accountId;
          ((_a = req.query),
            (_b = _a.limit),
            (limit = _b === void 0 ? 50 : _b),
            (_c = _a.offset),
            (offset = _c === void 0 ? 0 : _c));
          return [
            4 /*yield*/,
            business_logic_service_1.businessLogicService.getTransactionHistory(
              userId,
              accountId,
              Number(limit),
              Number(offset),
            ),
          ];
        case 1:
          history_1 = _e.sent();
          logger_js_1.logger.info("Transaction history retrieved", {
            event: "TRANSACTION_HISTORY_RETRIEVED",
            userId: userId,
            accountId: accountId,
            limit: limit,
            offset: offset,
            count: history_1.length,
          });
          res.json({
            success: true,
            data: history_1,
          });
          return [3 /*break*/, 3];
        case 2:
          error_5 = _e.sent();
          logger_js_1.logger.error("Transaction history retrieval failed", {
            event: "TRANSACTION_HISTORY_ERROR",
            userId: (_d = req.user) === null || _d === void 0 ? void 0 : _d.id,
            accountId: req.params.accountId,
            error: error_5.message,
          });
          next(error_5);
          return [3 /*break*/, 3];
        case 3:
          return [2 /*return*/];
      }
    });
  });
};
exports.getTransactionHistory = getTransactionHistory;
var healthCheck = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var health, error_6;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          return [
            4 /*yield*/,
            business_logic_service_1.businessLogicService.healthCheck(),
          ];
        case 1:
          health = _a.sent();
          res.json({
            success: true,
            data: health,
          });
          return [3 /*break*/, 3];
        case 2:
          error_6 = _a.sent();
          logger_js_1.logger.error("Business logic health check failed", {
            event: "BUSINESS_LOGIC_HEALTH_CHECK_ERROR",
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
exports.healthCheck = healthCheck;
