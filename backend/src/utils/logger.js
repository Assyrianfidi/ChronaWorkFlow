"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.logger = void 0;
var winston_1 = require("winston");
var format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
var logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format,
    defaultMeta: { service: 'accubooks-backend' },
    transports: [
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});
exports.logger = logger;
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
var Logger = /** @class */ (function () {
    function Logger() {
        this.logger = logger;
    }
    Logger.prototype.info = function (message, meta) {
        this.logger.info(message, meta);
    };
    Logger.prototype.error = function (message, meta) {
        this.logger.error(message, meta);
    };
    Logger.prototype.warn = function (message, meta) {
        this.logger.warn(message, meta);
    };
    Logger.prototype.debug = function (message, meta) {
        this.logger.debug(message, meta);
    };
    return Logger;
}());
exports.Logger = Logger;
