/**
 * TerraFlux - IPC Communication Module
 * 
 * This module manages the Inter-Process Communication (IPC) between
 * the main Electron process and renderer processes, routing messages
 * through the specified handlers.
 */

const { ipcMain } = require('electron');
const { 
  validateMessage, 
  createResponse, 
  createErrorResponse, 
  ErrorCodes 
} = require('./protocol');
const errorHandler = require('../error-handling');
const logger = require('../error-handling/logger');

// Handler registry
let messageHandlers = {};

/**
 * Initialize the IPC communication system
 * @param {Object} handlers - Map of message types to handler functions
 */
function initialize(handlers) {
  messageHandlers = handlers || {};
  
  // Set up main IPC channel
  setupMainChannel();
  
  logger.info('IPC system initialized', {
    handlerCount: Object.keys(messageHandlers).length
  });
}

/**
 * Set up the main IPC channel for handling messages
 */
function setupMainChannel() {
  // Remove any existing handlers
  ipcMain.removeAllListeners('ipc-message');
  
  // Set up the main handler
  ipcMain.handle('ipc-message', async (event, message) => {
    try {
      return await handleMessage(message, event);
    } catch (error) {
      logger.error('Unhandled error in IPC message handler', {
        error,
        messageType: message?.type
      });
      
      // Create a generic error response
      return createErrorResponse(
        message || { type: 'unknown', correlationId: 'error' },
        ErrorCodes.UNKNOWN_ERROR,
        error.message || 'An unknown error occurred',
        process.env.NODE_ENV === 'development' ? error : null
      );
    }
  });
  
  logger.debug('Main IPC channel established');
}

/**
 * Handle an incoming IPC message
 * @param {Object} message - The message to handle
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event
 * @returns {Promise<Object>} Response object
 */
async function handleMessage(message, event) {
  // Validate the message format
  const validation = validateMessage(message);
  
  if (!validation.valid) {
    logger.warn('Invalid message format', {
      error: validation.error,
      message
    });
    
    return createErrorResponse(
      message || { type: 'invalid', correlationId: 'error' },
      validation.error.code,
      validation.error.message
    );
  }
  
  // Look up the appropriate handler
  const handler = messageHandlers[message.type];
  
  if (!handler || typeof handler !== 'function') {
    logger.warn(`No handler found for message type: ${message.type}`);
    
    return createErrorResponse(
      message,
      ErrorCodes.HANDLER_NOT_FOUND,
      `No handler found for message type: ${message.type}`
    );
  }
  
  try {
    // Execute the handler
    const result = await handler({ 
      payload: message.payload,
      event,
      sender: event.sender,
      message
    });
    
    // Log the successful handling (debug level to avoid noise)
    logger.debug(`Handled message: ${message.type}`, {
      correlationId: message.correlationId,
      hasResult: !!result
    });
    
    // Return a successful response
    return createResponse(message, true, result);
  } catch (error) {
    // Log the error
    logger.error(`Error handling message ${message.type}:`, {
      error,
      correlationId: message.correlationId,
      messageType: message.type
    });
    
    // Format different error types consistently
    let errorInfo = {
      code: error.code || ErrorCodes.HANDLER_ERROR,
      message: error.message || 'An error occurred while processing the request'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorInfo.stack = error.stack;
      errorInfo.details = error.details || error;
    }
    
    return createResponse(message, false, null, errorInfo);
  }
}

/**
 * Send a message to a specific window's renderer process
 * @param {Electron.WebContents} webContents - The target renderer's webContents
 * @param {string} channel - The channel to send on
 * @param {any} data - The data to send
 * @returns {boolean} Whether the message was sent successfully
 */
function sendToRenderer(webContents, channel, data = null) {
  if (!webContents || webContents.isDestroyed()) {
    logger.warn(`Cannot send to renderer: WebContents is not available or destroyed`);
    return false;
  }
  
  try {
    webContents.send(channel, data);
    return true;
  } catch (error) {
    logger.error(`Failed to send message to renderer: ${error.message}`, {
      channel,
      error
    });
    return false;
  }
}

/**
 * Broadcast a message to all renderer processes
 * @param {Electron.BrowserWindow[]} windows - Array of browser windows
 * @param {string} channel - The channel to send on
 * @param {any} data - The data to send
 * @returns {number} Number of windows the message was successfully sent to
 */
function broadcast(windows, channel, data = null) {
  if (!Array.isArray(windows) || windows.length === 0) {
    logger.warn('No windows to broadcast to');
    return 0;
  }
  
  let successCount = 0;
  
  for (const window of windows) {
    if (window && !window.isDestroyed() && window.webContents) {
      try {
        window.webContents.send(channel, data);
        successCount++;
      } catch (error) {
        logger.error(`Failed to broadcast to window: ${error.message}`, { error });
      }
    }
  }
  
  return successCount;
}

/**
 * Add a new message handler
 * @param {string} type - The message type to handle
 * @param {Function} handler - The handler function
 */
function addHandler(type, handler) {
  if (!type || typeof type !== 'string') {
    throw new Error('Message type must be a string');
  }
  
  if (!handler || typeof handler !== 'function') {
    throw new Error('Handler must be a function');
  }
  
  messageHandlers[type] = handler;
  logger.debug(`Added handler for message type: ${type}`);
}

/**
 * Remove a message handler
 * @param {string} type - The message type to remove handler for
 * @returns {boolean} Whether a handler was removed
 */
function removeHandler(type) {
  if (messageHandlers[type]) {
    delete messageHandlers[type];
    logger.debug(`Removed handler for message type: ${type}`);
    return true;
  }
  return false;
}

/**
 * Get the current list of registered message types
 * @returns {string[]} List of message types that have handlers
 */
function getRegisteredMessageTypes() {
  return Object.keys(messageHandlers);
}

/**
 * Clear all message handlers
 */
function clearHandlers() {
  messageHandlers = {};
  logger.debug('Cleared all message handlers');
}

module.exports = {
  initialize,
  sendToRenderer,
  broadcast,
  addHandler,
  removeHandler,
  getRegisteredMessageTypes,
  clearHandlers
};
