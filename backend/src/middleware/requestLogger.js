"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
var logger_js_1 = require("../utils/logger.js");
var requestLogger = function (req, res, next) {
  var start = Date.now();
  res.on("finish", function () {
    var duration = Date.now() - start;
    var logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: "".concat(duration, "ms"),
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    };
    if (res.statusCode >= 400) {
      logger_js_1.logger.warn("HTTP Request", logData);
    } else {
      logger_js_1.logger.info("HTTP Request", logData);
    }
  });
  next();
};
exports.requestLogger = requestLogger;
