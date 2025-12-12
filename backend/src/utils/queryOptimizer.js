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
exports.QueryOptimizer = void 0;
var client_1 = require("@prisma/client");
/**
 * Query optimization utilities for database performance
 */
var QueryOptimizer = /** @class */ (function () {
  function QueryOptimizer() {}
  /**
   * Batch fetch related entities to avoid N+1 queries
   */
  QueryOptimizer.batchFetchTransactions = function (transactionIds_1) {
    return __awaiter(
      this,
      arguments,
      void 0,
      function (transactionIds, includeRelations) {
        var startTime, transactions, duration, transactions, duration, error_1;
        if (includeRelations === void 0) {
          includeRelations = true;
        }
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              startTime = Date.now();
              _a.label = 1;
            case 1:
              _a.trys.push([1, 6, , 7]);
              if (!includeRelations) return [3 /*break*/, 3];
              return [
                4 /*yield*/,
                this.prisma.transaction.findMany({
                  where: { id: { in: transactionIds } },
                }),
              ];
            case 2:
              transactions = _a.sent();
              duration = Date.now() - startTime;
              console.log("Batch fetch completed", {
                transactionCount: transactions.length,
                duration: "".concat(duration, "ms"),
                queryType: "batchFetchTransactions",
              });
              return [2 /*return*/, transactions];
            case 3:
              return [
                4 /*yield*/,
                this.prisma.transaction.findMany({
                  where: { id: { in: transactionIds } },
                }),
              ];
            case 4:
              transactions = _a.sent();
              duration = Date.now() - startTime;
              console.log("Batch fetch completed", {
                transactionCount: transactions.length,
                duration: "".concat(duration, "ms"),
                queryType: "batchFetchTransactionsSimple",
              });
              return [2 /*return*/, transactions];
            case 5:
              return [3 /*break*/, 7];
            case 6:
              error_1 = _a.sent();
              console.error("Batch fetch failed", {
                error:
                  error_1 instanceof Error ? error_1.message : "Unknown error",
                transactionCount: transactionIds.length,
              });
              throw error_1;
            case 7:
              return [2 /*return*/];
          }
        });
      },
    );
  };
  /**
   * Optimized account balance calculation
   */
  QueryOptimizer.getAccountBalances = function (accountIds, asOfDate) {
    return __awaiter(this, void 0, void 0, function () {
      var startTime, dateFilter, balances, duration, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            startTime = Date.now();
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            dateFilter = asOfDate ? { lte: asOfDate } : undefined;
            return [
              4 /*yield*/,
              this.prisma.transactionLine.groupBy({
                by: ["accountId"],
                where: {
                  accountId: { in: accountIds },
                  transaction: {
                    date: dateFilter,
                  },
                },
                _sum: {
                  debit: true,
                  credit: true,
                },
                _count: {
                  id: true,
                },
              }),
            ];
          case 2:
            balances = _a.sent();
            duration = Date.now() - startTime;
            console.log("Account balances calculated", {
              accountCount: balances.length,
              duration: "".concat(duration, "ms"),
              queryType: "getAccountBalances",
            });
            return [2 /*return*/, balances];
          case 3:
            error_2 = _a.sent();
            console.error("Account balance calculation failed", {
              error:
                error_2 instanceof Error ? error_2.message : "Unknown error",
              accountCount: accountIds.length,
            });
            throw error_2;
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Paginated transaction listing with optimized queries
   */
  QueryOptimizer.getTransactionsPaginated = function (companyId_1) {
    return __awaiter(
      this,
      arguments,
      void 0,
      function (companyId, page, limit, filters) {
        var startTime,
          skip,
          whereClause,
          _a,
          transactions,
          total,
          duration,
          error_3;
        if (page === void 0) {
          page = 1;
        }
        if (limit === void 0) {
          limit = 20;
        }
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              startTime = Date.now();
              skip = (page - 1) * limit;
              _b.label = 1;
            case 1:
              _b.trys.push([1, 3, , 4]);
              whereClause = { companyId: companyId };
              if (filters) {
                if (filters.startDate || filters.endDate) {
                  whereClause.date = {};
                  if (filters.startDate)
                    whereClause.date.gte = filters.startDate;
                  if (filters.endDate) whereClause.date.lte = filters.endDate;
                }
                if (filters.accountId) {
                  whereClause.lines = {
                    some: { accountId: filters.accountId },
                  };
                }
                if (filters.minAmount || filters.maxAmount) {
                  whereClause.totalAmount = {};
                  if (filters.minAmount)
                    whereClause.totalAmount.gte = filters.minAmount;
                  if (filters.maxAmount)
                    whereClause.totalAmount.lte = filters.maxAmount;
                }
              }
              return [
                4 /*yield*/,
                Promise.all([
                  this.prisma.transaction.findMany({
                    where: whereClause,
                    include: {
                      lines: {
                        include: {
                          account: {
                            select: {
                              id: true,
                              name: true,
                              type: true,
                            },
                          },
                        },
                      },
                      company: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                    orderBy: { date: "desc" },
                    skip: skip,
                    take: limit,
                  }),
                  this.prisma.transaction.count({ where: whereClause }),
                ]),
              ];
            case 2:
              ((_a = _b.sent()), (transactions = _a[0]), (total = _a[1]));
              duration = Date.now() - startTime;
              console.log("Paginated transactions fetched", {
                companyId: companyId,
                page: page,
                limit: limit,
                total: total,
                duration: "".concat(duration, "ms"),
                queryType: "getTransactionsPaginated",
              });
              return [
                2 /*return*/,
                {
                  transactions: transactions,
                  pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                  },
                },
              ];
            case 3:
              error_3 = _b.sent();
              console.error("Paginated transactions fetch failed", {
                error:
                  error_3 instanceof Error ? error_3.message : "Unknown error",
                companyId: companyId,
                page: page,
                limit: limit,
              });
              throw error_3;
            case 4:
              return [2 /*return*/];
          }
        });
      },
    );
  };
  /**
   * Transaction batch processing for bulk operations
   */
  QueryOptimizer.processTransactionBatch = function (transactions_1) {
    return __awaiter(
      this,
      arguments,
      void 0,
      function (transactions, batchSize) {
        var startTime, results, i, batch, batchResults, error_4, duration;
        var _this = this;
        if (batchSize === void 0) {
          batchSize = 50;
        }
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              startTime = Date.now();
              results = [];
              i = 0;
              _a.label = 1;
            case 1:
              if (!(i < transactions.length)) return [3 /*break*/, 6];
              batch = transactions.slice(i, i + batchSize);
              _a.label = 2;
            case 2:
              _a.trys.push([2, 4, , 5]);
              return [
                4 /*yield*/,
                this.prisma.$transaction(
                  batch.map(function (tx) {
                    return _this.prisma.transaction.create({
                      data: {
                        transactionNumber: tx.transactionNumber,
                        date: tx.date,
                        type: tx.type,
                        totalAmount: tx.totalAmount,
                        description: tx.description,
                        companyId: tx.companyId,
                        lines: tx.lines || [],
                      },
                    });
                  }),
                ),
              ];
            case 3:
              batchResults = _a.sent();
              results.push.apply(results, batchResults);
              console.log("Transaction batch processed", {
                batchNumber: Math.floor(i / batchSize) + 1,
                batchSize: batch.length,
                processedCount: results.length,
              });
              return [3 /*break*/, 5];
            case 4:
              error_4 = _a.sent();
              console.error("Transaction batch failed", {
                error:
                  error_4 instanceof Error ? error_4.message : "Unknown error",
                batchNumber: Math.floor(i / batchSize) + 1,
                batchSize: batch.length,
              });
              throw error_4;
            case 5:
              i += batchSize;
              return [3 /*break*/, 1];
            case 6:
              duration = Date.now() - startTime;
              console.log("All transaction batches processed", {
                totalTransactions: transactions.length,
                totalProcessed: results.length,
                duration: "".concat(duration, "ms"),
                batchesCount: Math.ceil(transactions.length / batchSize),
              });
              return [2 /*return*/, results];
          }
        });
      },
    );
  };
  QueryOptimizer.prisma = new client_1.PrismaClient();
  return QueryOptimizer;
})();
exports.QueryOptimizer = QueryOptimizer;
