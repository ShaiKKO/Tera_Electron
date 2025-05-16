/**
 * TerraFlux - Logger Module
 * 
 * This module provides logging functionality with different log levels,
 * output formats, and transport options for both development and production.
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const winston = require('winston');
const { format, transports } = winston;

// Log levels
const levels = {
  error: 0,  // Critical application errors
  warn: 1,   // Non-critical issues that should be addressed
  info: 2,   // Normal operational information
  debug: 3,  // Detailed debugging information
  trace: 4   // Very verbose debugging information
};

// Define log directory
let logDir = path.join(process.cwd(), 'logs');

// Function to initialize logger directory once app is ready
const initializeLogDirectory = () => {
  try {
    if (app && app.getPath) {
      logDir = app.getPath('logs');
    }
  } catch (err) {
    console.warn('Could not get app logs path, using fallback', err);
    // Already using fallback path
  }

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

// Initialize log directory with fallback first
initializeLogDirectory();

// Setup to reinitialize once the app is ready
if (app && !app.isReady()) {
  app.whenReady().then(initializeLogDirectory);
}

// Custom format for log messages
const customFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if available
    if (Object.keys(meta).length > 0) {
      // Don't include stack in the regular message if it's in meta
      const metaCopy = { ...meta };
      if (metaCopy.stack && metaCopy.details && metaCopy.details.stack) {
        delete metaCopy.details.stack;
      }
      
      logMessage += ` - ${JSON.stringify(metaCopy, null, 0)}`;
    }
    
    return logMessage;
  })
);

// Create the logger
const logger = winston.createLogger({
  levels,
  level: process.env.NODE_ENV === 'development' ? 'trace' : 'info',
  format: customFormat,
  transports: [
    // File for all logs
    new transports.File({
      filename: path.join(logDir, 'terraflux.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Separate file for errors
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    })
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  rejectionHandlers: [
    new transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  exitOnError: false
});

// Add console transport in development mode
if (process.env.NODE_ENV === 'development') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(info => {
        const { timestamp, level, message, ...meta } = info;
        let logMessage = `${timestamp} [${level}]: ${message}`;
        
        // Only add simplified metadata in console
        if (Object.keys(meta).length > 0 && meta.code) {
          logMessage += ` (${meta.code})`;
        }
        
        return logMessage;
      })
    )
  }));
}

/**
 * Log an error message
 * @param {string} message - Error message
 * @param {Object} [metadata] - Additional metadata
 */
function error(message, metadata = {}) {
  logger.error(message, metadata);
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 * @param {Object} [metadata] - Additional metadata
 */
function warn(message, metadata = {}) {
  logger.warn(message, metadata);
}

/**
 * Log an info message
 * @param {string} message - Information message
 * @param {Object} [metadata] - Additional metadata
 */
function info(message, metadata = {}) {
  logger.info(message, metadata);
}

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {Object} [metadata] - Additional metadata
 */
function debug(message, metadata = {}) {
  logger.debug(message, metadata);
}

/**
 * Log a trace message (very detailed)
 * @param {string} message - Trace message
 * @param {Object} [metadata] - Additional metadata
 */
function trace(message, metadata = {}) {
  logger.log('trace', message, metadata);
}

module.exports = {
  error,
  warn,
  info,
  debug,
  trace,
  stream: {
    write: (message) => {
      info(message.trim());
    }
  },
  logDir
};
