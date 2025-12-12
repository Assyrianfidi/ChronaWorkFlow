"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPartial =
  exports.sendNoContent =
  exports.sendCreated =
  exports.sendPaginatedResponse =
  exports.sendSuccess =
    void 0;
/**
 * Success response helper
 */
var sendSuccess = function (res, data, statusCode, meta) {
  if (statusCode === void 0) {
    statusCode = 200;
  }
  var response = {
    success: true,
    data: data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: meta === null || meta === void 0 ? void 0 : meta.requestId,
      version: process.env.npm_package_version || "1.0.0",
    },
  };
  if (meta === null || meta === void 0 ? void 0 : meta.pagination) {
    response.meta.pagination = meta.pagination;
  }
  if (
    (meta === null || meta === void 0 ? void 0 : meta.warnings) &&
    meta.warnings.length > 0
  ) {
    response.meta.warnings = meta.warnings;
  }
  return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Paginated response helper
 */
var sendPaginatedResponse = function (
  res,
  data,
  page,
  limit,
  total,
  requestId,
) {
  var totalPages = Math.ceil(total / limit);
  var hasNext = page < totalPages;
  var hasPrev = page > 1;
  return (0, exports.sendSuccess)(res, data, 200, {
    requestId: requestId,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
      hasNext: hasNext,
      hasPrev: hasPrev,
    },
  });
};
exports.sendPaginatedResponse = sendPaginatedResponse;
/**
 * Created response helper (201)
 */
var sendCreated = function (res, data, requestId) {
  return (0, exports.sendSuccess)(res, data, 201, { requestId: requestId });
};
exports.sendCreated = sendCreated;
/**
 * No content response helper (204)
 */
var sendNoContent = function (res) {
  return res.status(204).end();
};
exports.sendNoContent = sendNoContent;
/**
 * Partial content response helper (206)
 */
var sendPartial = function (res, data, requestId, warnings) {
  return (0, exports.sendSuccess)(res, data, 206, {
    requestId: requestId,
    warnings: warnings,
  });
};
exports.sendPartial = sendPartial;
