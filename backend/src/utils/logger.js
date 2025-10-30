const winston = require('winston');
const path = require('path');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;
const { LOG_LEVEL, LOG_FILE, NODE_ENV } = require('../config');

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
require('fs').mkdirSync(logsDir, { recursive: true });

// Define different formats for different environments
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  logFormat
);

const prodFormat = combine(
  timestamp(),
  format.errors({ stack: true }),
  json()
);

// Create logger instance
const logger = createLogger({
  level: LOG_LEVEL || 'info',
  format: NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'accubooks-api' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Write all logs with level `info` and below to `combined.log`
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// If we're not in production, log to the console as well
if (NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: devFormat,
    })
  );
}

// Create a stream for morgan to use with winston
const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Optionally exit the process (not recommended for production)
  // process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process (not recommended for production)
  // process.exit(1);
});

module.exports = {
  logger,
  stream,
};
