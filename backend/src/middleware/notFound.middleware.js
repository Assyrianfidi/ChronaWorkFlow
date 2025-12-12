"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
var http_status_codes_1 = require("http-status-codes");
var errorHandler_js_1 = require("../utils/errorHandler.js");
/**
 * Middleware to handle 404 Not Found errors
 */
var notFound = function (req, res, next) {
  next(
    new errorHandler_js_1.ApiError(
      "Can't find ".concat(req.originalUrl, " on this server!"),
      http_status_codes_1.StatusCodes.NOT_FOUND,
    ),
  );
};
exports.notFound = notFound;
exports.default = exports.notFound;
