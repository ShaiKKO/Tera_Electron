/**
 * TerraFlux - Error Handling Module
 * 
 * This module provides centralized error handling functionality for
 * the entire application, including logging, reporting, and user-facing
 * error messages.
 */

const { app, dialog } = require('electron');
const logger = require('./logger');
const errorTypes = require('./error-types');

/**
 * Handle an application error
 * @param {Object} error - Error object with details
 */
function handleError(error) {
  // Log the error
  logger.error(
    error.message || 'An unknown error occurred',
    {
      code: error.code,
      details: error.details,
      stack: error.stack,
      severity: error.severity || 'ERROR'
    }
  );
  
  // For development, log to console as well
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${error.code || 'ERROR'}] ${error.message}`, error.details || error);
  }
}

/**
 * Handle a critical error that requires immediate attention
 * @param {Error} error - The error object
 * @param {string} [source='unknown'] - Source of the error
 */
function handleCriticalError(error, source = 'unknown') {
  const errorInfo = {
    code: error.code || 'CRITICAL_ERROR',
    message: error.message || 'A critical error has occurred',
    details: error,
    severity: 'CRITICAL',
    source
  };
  
  // Log the critical error
  logger.error(errorInfo.message, {
    code: errorInfo.code,
    details: errorInfo.details,
    stack: error.stack,
    severity: errorInfo.severity,
    source: errorInfo.source
  });
  
  // Always log to console for critical errors
  console.error(`[CRITICAL] ${errorInfo.message}`, error);
  
  // Show error dialog if we have a GUI
  if (app.isReady()) {
    showErrorDialog(errorInfo);
  }
}

/**
 * Show an error dialog to the user
 * @param {Object} error - Error information to display
 * @param {BrowserWindow} [parentWindow=null] - Parent window for the dialog
 */
function showErrorDialog(error, parentWindow = null) {
  const options = {
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'TerraFlux - Error',
    message: error.title || 'An error has occurred',
    detail: error.message || 'Please try again or restart the application.',
  };
  
  // Add more information in development mode
  if (process.env.NODE_ENV === 'development') {
    options.detail += `\n\nError Code: ${error.code || 'UNKNOWN'}\n${error.stack || ''}`;
  }
  
  // Show dialog, but don't wait for the result
  dialog.showMessageBox(parentWindow, options).catch(dialogError => {
    console.error('Failed to show error dialog:', dialogError);
  });
}

/**
 * Get a formatted error object with standard fields
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {any} [details=null] - Additional details
 * @param {string} [severity='ERROR'] - Error severity
 * @returns {Object} Formatted error object
 */
function createError(code, message, details = null, severity = 'ERROR') {
  return {
    code,
    message,
    details,
    severity,
    timestamp: Date.now()
  };
}

module.exports = {
  handleError,
  handleCriticalError,
  showErrorDialog,
  createError,
  types: errorTypes
};
