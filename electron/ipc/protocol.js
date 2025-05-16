/**
 * TerraFlux - IPC Protocol Definition
 * 
 * This module defines the structured IPC communication protocol between
 * the main and renderer processes, including message types and formats.
 */

/**
 * IPC Message Types
 * @readonly
 * @enum {string}
 */
const MessageTypes = {
  // App related messages
  APP_GET_INFO: 'app:get-info',
  APP_GET_PATHS: 'app:get-paths',
  APP_QUIT: 'app:quit',
  APP_RESTART: 'app:restart',
  
  // Window related messages
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_UNMAXIMIZE: 'window:unmaximize',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_FOCUS: 'window:focus',
  WINDOW_BLUR: 'window:blur',
  WINDOW_SET_BOUNDS: 'window:set-bounds',
  WINDOW_GET_BOUNDS: 'window:get-bounds',
  WINDOW_SET_FULLSCREEN: 'window:fullscreen',
  WINDOW_ENTER_KIOSK: 'window:enter-kiosk',
  WINDOW_LEAVE_KIOSK: 'window:leave-kiosk',
  WINDOW_SET_TITLE: 'window:set-title',
  WINDOW_IS_FOCUSED: 'window:is-focused',
  
  // File related messages
  FILE_SELECT_DIRECTORY: 'file:select-directory',
  FILE_SELECT_SAVE_PATH: 'file:select-save-path',
  FILE_SELECT_LOAD_PATH: 'file:select-load-path',
  FILE_GET_PATH_INFO: 'file:get-path-info',
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_DELETE: 'file:delete',
  FILE_EXISTS: 'file:exists',
  FILE_LIST_DIR: 'file:list-dir',
  
  // Game related messages
  GAME_SAVE: 'game:save',
  GAME_LOAD: 'game:load',
  GAME_LIST_SAVES: 'game:list-saves',
  GAME_DELETE_SAVE: 'game:delete-save',
  GAME_SET_SAVE_DIRECTORY: 'game:set-save-dir',
  GAME_GET_SAVE_DIRECTORY: 'game:get-save-dir',
  
  // System related messages
  SYSTEM_GET_INFO: 'system:get-info',
  SYSTEM_GET_MEMORY: 'system:get-memory',
  SYSTEM_GET_DRIVES: 'system:get-drives',
  SYSTEM_OPEN_EXTERNAL: 'system:open-external',
  SYSTEM_SHOW_ITEM_IN_FOLDER: 'system:show-item',
  
  // Dialog related messages
  DIALOG_SHOW_MESSAGE: 'dialog:show-message',
  DIALOG_SHOW_ERROR: 'dialog:show-error',
  DIALOG_SHOW_QUESTION: 'dialog:show-question',
  DIALOG_SHOW_WARNING: 'dialog:show-warning',
  DIALOG_SHOW_SAVE_DIALOG: 'dialog:show-save',
  DIALOG_SHOW_OPEN_DIALOG: 'dialog:show-open',
  
  // Screen related messages
  SCREEN_GET_ALL_DISPLAYS: 'screen:get-displays',
  SCREEN_GET_PRIMARY_DISPLAY: 'screen:get-primary',
  SCREEN_GET_CURSOR_POSITION: 'screen:get-cursor',
  SCREEN_CAPTURE: 'screen:capture',
  
  // Settings related messages
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_IMPORT: 'settings:import',
  SETTINGS_EXPORT: 'settings:export',
  
  // Update related messages
  UPDATE_CHECK: 'update:check',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_INSTALL: 'update:install',
};

/**
 * IPC Error Codes
 * @readonly
 * @enum {string}
 */
const ErrorCodes = {
  INVALID_MESSAGE_FORMAT: 'invalid_message_format',
  UNKNOWN_MESSAGE_TYPE: 'unknown_message_type',
  HANDLER_NOT_FOUND: 'handler_not_found',
  HANDLER_ERROR: 'handler_error',
  HANDLER_TIMEOUT: 'handler_timeout',
  UNKNOWN_ERROR: 'unknown_error',
  PARAMETERS_INVALID: 'parameters_invalid'
};

/**
 * Create a standardized IPC response object
 * @param {Object} message - Original message
 * @param {boolean} success - Whether the operation was successful
 * @param {any} [data=null] - Response data
 * @param {Object} [error=null] - Error information if !success
 * @returns {Object} A formatted response object
 */
function createResponse(message, success, data = null, error = null) {
  return {
    type: message.type,
    correlationId: message.correlationId,
    timestamp: Date.now(),
    success,
    data,
    error
  };
}

/**
 * Validate message format
 * @param {Object} message - Message object to validate
 * @returns {Object} Validation result
 */
function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    return {
      valid: false,
      error: { code: ErrorCodes.INVALID_MESSAGE_FORMAT, message: 'Message must be an object' }
    };
  }
  
  if (!message.type || typeof message.type !== 'string') {
    return {
      valid: false,
      error: { code: ErrorCodes.INVALID_MESSAGE_FORMAT, message: 'Message type must be a string' }
    };
  }
  
  // Correlation ID is optional but should be a string if provided
  if (message.correlationId && typeof message.correlationId !== 'string') {
    return {
      valid: false,
      error: { code: ErrorCodes.INVALID_MESSAGE_FORMAT, message: 'Correlation ID must be a string' }
    };
  }
  
  // Check if the message type is recognized
  if (!(Object.values(MessageTypes).includes(message.type))) {
    return {
      valid: false,
      error: {
        code: ErrorCodes.UNKNOWN_MESSAGE_TYPE,
        message: `Unknown message type: ${message.type}`
      }
    };
  }
  
  return { valid: true };
}

/**
 * Create a standard error response
 * @param {Object} message - Original message
 * @param {string} code - Error code
 * @param {string} errorMessage - Human-readable error message
 * @param {any} [details=null] - Additional error details
 * @returns {Object} Error response object
 */
function createErrorResponse(message, code, errorMessage, details = null) {
  return createResponse(message, false, null, {
    code,
    message: errorMessage,
    details
  });
}

module.exports = {
  MessageTypes,
  ErrorCodes,
  createResponse,
  createErrorResponse,
  validateMessage
};
