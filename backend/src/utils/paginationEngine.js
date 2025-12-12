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
exports.FilterEngine = exports.PaginationEngine = void 0;
var errorHandler_js_1 = require("./errorHandler.js");
/**
 * Pagination and sorting utilities
 */
var PaginationEngine = /** @class */ (function () {
  function PaginationEngine() {}
  /**
   * Server-side pagination with offset
   */
  PaginationEngine.paginateWithOffset = function (model_1, options_1) {
    return __awaiter(
      this,
      arguments,
      void 0,
      function (model, options, whereClause) {
        var page, limit, skip, enhancedWhere, orderBy, _a, data, total, error_1;
        if (whereClause === void 0) {
          whereClause = {};
        }
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              page = Math.max(1, options.page || 1);
              limit = Math.min(100, Math.max(1, options.limit || 20));
              skip = (page - 1) * limit;
              enhancedWhere = this.buildWhereClause(whereClause, options);
              orderBy = this.buildOrderByClause(options);
              _b.label = 1;
            case 1:
              _b.trys.push([1, 3, , 4]);
              return [
                4 /*yield*/,
                Promise.all([
                  model.findMany({
                    where: enhancedWhere,
                    orderBy: orderBy,
                    skip: skip,
                    take: limit,
                    include: options.include,
                    select: options.select,
                  }),
                  model.count({ where: enhancedWhere }),
                ]),
              ];
            case 2:
              ((_a = _b.sent()), (data = _a[0]), (total = _a[1]));
              return [
                2 /*return*/,
                {
                  data: data,
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
              error_1 = _b.sent();
              throw new errorHandler_js_1.ApiError(
                "Failed to fetch paginated data",
                500,
                errorHandler_js_1.ErrorCodes.DATABASE_ERROR,
                true,
                error_1 instanceof Error ? error_1.message : "Unknown error",
              );
            case 4:
              return [2 /*return*/];
          }
        });
      },
    );
  };
  /**
   * Cursor-based pagination for large datasets
   */
  PaginationEngine.paginateWithCursor = function (model_1, options_1) {
    return __awaiter(
      this,
      arguments,
      void 0,
      function (model, options, whereClause, cursorField) {
        var limit,
          direction,
          enhancedWhere,
          orderBy,
          data,
          hasNext,
          hasPrev,
          pagination,
          error_2;
        if (whereClause === void 0) {
          whereClause = {};
        }
        if (cursorField === void 0) {
          cursorField = "id";
        }
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              limit = Math.min(100, Math.max(1, options.limit || 20));
              direction = options.direction || "forward";
              enhancedWhere = this.buildCursorWhereClause(
                whereClause,
                options,
                cursorField,
                direction,
              );
              orderBy = this.buildCursorOrderByClause(
                options,
                cursorField,
                direction,
              );
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              return [
                4 /*yield*/,
                model.findMany({
                  where: enhancedWhere,
                  orderBy: orderBy,
                  take: limit + 1, // Fetch one extra to determine if there's more
                  include: options.include,
                  select: options.select,
                }),
              ];
            case 2:
              data = _a.sent();
              hasNext = data.length > limit;
              hasPrev = !!options.cursor;
              // Remove the extra item if exists
              if (hasNext) {
                data.pop();
              }
              // Reverse data if going backward
              if (direction === "backward") {
                data.reverse();
              }
              pagination = {
                hasNext: hasNext,
                hasPrev: hasPrev,
              };
              // Set cursors
              if (data.length > 0) {
                if (direction === "forward") {
                  pagination.nextCursor = data[data.length - 1][cursorField];
                } else {
                  pagination.prevCursor = data[0][cursorField];
                }
              }
              return [2 /*return*/, { data: data, pagination: pagination }];
            case 3:
              error_2 = _a.sent();
              throw new errorHandler_js_1.ApiError(
                "Failed to fetch cursor paginated data",
                500,
                errorHandler_js_1.ErrorCodes.DATABASE_ERROR,
                true,
                error_2 instanceof Error ? error_2.message : "Unknown error",
              );
            case 4:
              return [2 /*return*/];
          }
        });
      },
    );
  };
  /**
   * Build where clause with filters
   */
  PaginationEngine.buildWhereClause = function (baseWhere, options) {
    var where = __assign({}, baseWhere);
    // Search filter
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }
    // Date range filter
    if (options.dateRange) {
      where.timestamp = {};
      if (options.dateRange.start) {
        where.timestamp.gte = options.dateRange.start;
      }
      if (options.dateRange.end) {
        where.timestamp.lte = options.dateRange.end;
      }
    }
    // Numeric range filter
    if (options.numericRange) {
      if (
        options.numericRange.min !== undefined ||
        options.numericRange.max !== undefined
      ) {
        where.amount = {};
        if (options.numericRange.min !== undefined) {
          where.amount.gte = options.numericRange.min;
        }
        if (options.numericRange.max !== undefined) {
          where.amount.lte = options.numericRange.max;
        }
      }
    }
    // In/Not in filters
    if (options.in && options.in.length > 0) {
      where.id = { in: options.in };
    }
    if (options.notIn && options.notIn.length > 0) {
      where.id = { notIn: options.notIn };
    }
    return where;
  };
  /**
   * Build cursor-based where clause
   */
  PaginationEngine.buildCursorWhereClause = function (
    baseWhere,
    options,
    cursorField,
    direction,
  ) {
    var _a;
    var where = this.buildWhereClause(baseWhere, options);
    if (options.cursor) {
      var cursorOperator = direction === "forward" ? ">" : "<";
      where[cursorField] =
        ((_a = {}), (_a[cursorOperator] = options.cursor), _a);
    }
    return where;
  };
  /**
   * Build order by clause
   */
  PaginationEngine.buildOrderByClause = function (options) {
    var _a;
    var _b = options.sortBy,
      sortBy = _b === void 0 ? "createdAt" : _b,
      _c = options.sortOrder,
      sortOrder = _c === void 0 ? "desc" : _c,
      _d = options.nulls,
      nulls = _d === void 0 ? "last" : _d;
    return [((_a = {}), (_a[sortBy] = sortOrder), _a)];
  };
  /**
   * Build cursor-based order by clause
   */
  PaginationEngine.buildCursorOrderByClause = function (
    options,
    cursorField,
    direction,
  ) {
    var _a, _b;
    var _c = options.sortBy,
      sortBy = _c === void 0 ? "createdAt" : _c,
      _d = options.sortOrder,
      sortOrder = _d === void 0 ? "desc" : _d;
    // For cursor pagination, we need consistent ordering
    var primaryOrder =
      direction === "forward"
        ? sortOrder
        : sortOrder === "asc"
          ? "desc"
          : "asc";
    var orderBy = [((_a = {}), (_a[sortBy] = primaryOrder), _a)];
    // Add cursor field as secondary sort for uniqueness
    if (sortBy !== cursorField) {
      orderBy.push(((_b = {}), (_b[cursorField] = primaryOrder), _b));
    }
    return orderBy;
  };
  /**
   * Validate pagination parameters
   */
  PaginationEngine.validatePaginationParams = function (params) {
    if (params.page && (isNaN(params.page) || params.page < 1)) {
      throw new errorHandler_js_1.ApiError(
        "Invalid page parameter. Must be a positive integer.",
        400,
        errorHandler_js_1.ErrorCodes.INVALID_INPUT,
      );
    }
    if (
      params.limit &&
      (isNaN(params.limit) || params.limit < 1 || params.limit > 100)
    ) {
      throw new errorHandler_js_1.ApiError(
        "Invalid limit parameter. Must be between 1 and 100.",
        400,
        errorHandler_js_1.ErrorCodes.INVALID_INPUT,
      );
    }
    if (params.cursor && typeof params.cursor !== "string") {
      throw new errorHandler_js_1.ApiError(
        "Invalid cursor parameter. Must be a string.",
        400,
        errorHandler_js_1.ErrorCodes.INVALID_INPUT,
      );
    }
  };
  /**
   * Validate sort parameters
   */
  PaginationEngine.validateSortParams = function (params, allowedFields) {
    if (params.sortBy && !allowedFields.includes(params.sortBy)) {
      throw new errorHandler_js_1.ApiError(
        "Invalid sort field. Allowed fields: ".concat(allowedFields.join(", ")),
        400,
        errorHandler_js_1.ErrorCodes.INVALID_INPUT,
      );
    }
    if (params.sortOrder && !["asc", "desc"].includes(params.sortOrder)) {
      throw new errorHandler_js_1.ApiError(
        'Invalid sort order. Must be "asc" or "desc".',
        400,
        errorHandler_js_1.ErrorCodes.INVALID_INPUT,
      );
    }
  };
  /**
   * Create pagination metadata for response
   */
  PaginationEngine.createPaginationMeta = function (
    pagination,
    baseUrl,
    queryParams,
  ) {
    var meta = __assign({}, pagination);
    // Add navigation links if using offset pagination
    if (pagination.page !== undefined) {
      var page = pagination.page,
        limit = pagination.limit,
        totalPages = pagination.totalPages;
      var searchParams = new URLSearchParams(queryParams);
      // Self link
      searchParams.set("page", page.toString());
      meta.self = "".concat(baseUrl, "?").concat(searchParams.toString());
      // First page
      searchParams.set("page", "1");
      meta.first = "".concat(baseUrl, "?").concat(searchParams.toString());
      // Last page
      searchParams.set("page", totalPages.toString());
      meta.last = "".concat(baseUrl, "?").concat(searchParams.toString());
      // Previous page
      if (page > 1) {
        searchParams.set("page", (page - 1).toString());
        meta.prev = "".concat(baseUrl, "?").concat(searchParams.toString());
      }
      // Next page
      if (page < totalPages) {
        searchParams.set("page", (page + 1).toString());
        meta.next = "".concat(baseUrl, "?").concat(searchParams.toString());
      }
    }
    return meta;
  };
  return PaginationEngine;
})();
exports.PaginationEngine = PaginationEngine;
/**
 * Advanced filtering utilities
 */
var FilterEngine = /** @class */ (function () {
  function FilterEngine() {}
  /**
   * Build complex filters from query parameters
   */
  FilterEngine.buildFilters = function (query) {
    var filters = {};
    // Search filter
    if (query.search) {
      filters.search = query.search;
    }
    // Date range filter
    if (query.startDate || query.endDate) {
      filters.dateRange = {
        start: query.startDate ? new Date(query.startDate) : undefined,
        end: query.endDate ? new Date(query.endDate) : undefined,
      };
    }
    // Numeric range filter
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      filters.numericRange = {
        min: query.minAmount ? parseFloat(query.minAmount) : undefined,
        max: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
      };
    }
    // Array filters
    if (query.ids) {
      filters.in = Array.isArray(query.ids) ? query.ids : query.ids.split(",");
    }
    if (query.excludeIds) {
      filters.notIn = Array.isArray(query.excludeIds)
        ? query.excludeIds
        : query.excludeIds.split(",");
    }
    return filters;
  };
  /**
   * Validate filter parameters
   */
  FilterEngine.validateFilters = function (filters) {
    if (filters.dateRange) {
      var _a = filters.dateRange,
        start = _a.start,
        end = _a.end;
      if (start && end && start > end) {
        throw new errorHandler_js_1.ApiError(
          "Start date must be before end date.",
          400,
          errorHandler_js_1.ErrorCodes.INVALID_INPUT,
        );
      }
    }
    if (filters.numericRange) {
      var _b = filters.numericRange,
        min = _b.min,
        max = _b.max;
      if (min !== undefined && max !== undefined && min > max) {
        throw new errorHandler_js_1.ApiError(
          "Minimum value must be less than or equal to maximum value.",
          400,
          errorHandler_js_1.ErrorCodes.INVALID_INPUT,
        );
      }
    }
  };
  return FilterEngine;
})();
exports.FilterEngine = FilterEngine;
