/**
 * TerraFlux - Error Types
 * 
 * This module defines standardized error types and codes used throughout
 * the application. Having a centralized definition ensures consistency in
 * error handling and reporting.
 */

/**
 * Application error severity levels
 * @readonly
 * @enum {string}
 */
const ErrorSeverity = {
  INFO: 'INFO',         // Informational, not an error
  WARNING: 'WARNING',   // Possible issue, but non-critical
  ERROR: 'ERROR',       // Standard error, operation failed
  CRITICAL: 'CRITICAL', // Critical error, may affect app stability
  FATAL: 'FATAL'        // Fatal error, application cannot continue
};

/**
 * Application error categories
 * @readonly
 * @enum {string}
 */
const ErrorCategory = {
  APP: 'APP',           // Application lifecycle errors
  WINDOW: 'WINDOW',     // Window management errors
  FILE: 'FILE',         // File system operation errors
  NETWORK: 'NETWORK',   // Network and connectivity errors
  GAME: 'GAME',         // Game-specific errors
  RENDER: 'RENDER',     // Rendering and display errors
  IPC: 'IPC',           // Inter-process communication errors
  SYSTEM: 'SYSTEM',     // System and resource errors
  USER: 'USER',         // User input and interaction errors
  PLUGIN: 'PLUGIN',     // Plugin and extension errors
  SECURITY: 'SECURITY', // Security-related errors
  UNKNOWN: 'UNKNOWN'    // Unknown or unclassified errors
};

/**
 * Application error codes organized by category
 * @readonly
 * @type {Object.<string, string>}
 */
const ErrorCodes = {
  // Application errors
  APP_INIT_FAILED: 'APP_INIT_FAILED',
  APP_UPDATE_FAILED: 'APP_UPDATE_FAILED',
  APP_RESOURCE_MISSING: 'APP_RESOURCE_MISSING',
  APP_CONFIG_INVALID: 'APP_CONFIG_INVALID',
  
  // Window errors
  WINDOW_CREATION_FAILED: 'WINDOW_CREATION_FAILED',
  WINDOW_OPERATION_FAILED: 'WINDOW_OPERATION_FAILED',
  WINDOW_STATE_CORRUPTED: 'WINDOW_STATE_CORRUPTED',
  
  // File system errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
  FILE_READ_FAILED: 'FILE_READ_FAILED',
  FILE_WRITE_FAILED: 'FILE_WRITE_FAILED',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  
  // Network errors
  NETWORK_DISCONNECTED: 'NETWORK_DISCONNECTED',
  NETWORK_REQUEST_FAILED: 'NETWORK_REQUEST_FAILED',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_RESOURCE_UNAVAILABLE: 'NETWORK_RESOURCE_UNAVAILABLE',
  
  // Game errors
  GAME_SAVE_FAILED: 'GAME_SAVE_FAILED',
  GAME_LOAD_FAILED: 'GAME_LOAD_FAILED',
  GAME_STATE_INVALID: 'GAME_STATE_INVALID',
  GAME_RESOURCE_MISSING: 'GAME_RESOURCE_MISSING',
  
  // Rendering errors
  RENDER_CONTEXT_LOST: 'RENDER_CONTEXT_LOST',
  RENDER_RESOURCE_MISSING: 'RENDER_RESOURCE_MISSING',
  RENDER_PIPELINE_ERROR: 'RENDER_PIPELINE_ERROR',
  
  // IPC errors
  IPC_MESSAGE_INVALID: 'IPC_MESSAGE_INVALID',
  IPC_HANDLER_NOT_FOUND: 'IPC_HANDLER_NOT_FOUND',
  IPC_RESPONSE_TIMEOUT: 'IPC_RESPONSE_TIMEOUT',
  IPC_CHANNEL_CLOSED: 'IPC_CHANNEL_CLOSED',
  
  // System errors
  SYSTEM_RESOURCE_EXHAUSTED: 'SYSTEM_RESOURCE_EXHAUSTED',
  SYSTEM_CAPABILITY_UNAVAILABLE: 'SYSTEM_CAPABILITY_UNAVAILABLE',
  SYSTEM_PROCESS_FAILED: 'SYSTEM_PROCESS_FAILED',
  
  // User errors
  USER_INPUT_INVALID: 'USER_INPUT_INVALID',
  USER_OPERATION_CANCELED: 'USER_OPERATION_CANCELED',
  USER_PERMISSION_DENIED: 'USER_PERMISSION_DENIED',
  
  // Plugin errors
  PLUGIN_LOAD_FAILED: 'PLUGIN_LOAD_FAILED',
  PLUGIN_API_MISMATCH: 'PLUGIN_API_MISMATCH',
  PLUGIN_EXECUTION_ERROR: 'PLUGIN_EXECUTION_ERROR',
  
  // Security errors
  SECURITY_VALIDATION_FAILED: 'SECURITY_VALIDATION_FAILED',
  SECURITY_INTEGRITY_COMPROMISED: 'SECURITY_INTEGRITY_COMPROMISED',
  SECURITY_PERMISSION_DENIED: 'SECURITY_PERMISSION_DENIED',
  
  // General errors
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT'
};

/**
 * Create a standardized error object
 * @param {string} code - Error code from ErrorCodes
 * @param {string} message - Human-readable error message
 * @param {any} [details=null] - Additional error details
 * @param {string} [severity=ErrorSeverity.ERROR] - Error severity level
 * @returns {Object} Standardized error object
 */
function createError(code, message, details = null, severity = ErrorSeverity.ERROR) {
  // Determine category from code prefix
  let category = ErrorCategory.UNKNOWN;
  
  for (const cat of Object.values(ErrorCategory)) {
    if (code.startsWith(cat)) {
      category = cat;
      break;
    }
  }
  
  return {
    code,
    message,
    details,
    severity,
    category,
    timestamp: Date.now()
  };
}

/**
 * Check if an error is of a specific severity
 * @param {Object} error - Error object to check
 * @param {string} severity - Severity level to check against
 * @returns {boolean} Whether the error is of the specified severity
 */
function isSeverity(error, severity) {
  return error && error.severity === severity;
}

/**
 * Check if an error is in a specific category
 * @param {Object} error - Error object to check
 * @param {string} category - Category to check against
 * @returns {boolean} Whether the error is in the specified category
 */
function isCategory(error, category) {
  return error && error.category === category;
}

module.exports = {
  ErrorSeverity,
  ErrorCategory,
  ErrorCodes,
  createError,
  isSeverity,
  isCategory
};
