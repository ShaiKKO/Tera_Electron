/**
 * TerraFlux - IPC Handlers Index
 * 
 * This module consolidates all IPC message handlers and provides
 * a unified registration function for the main process.
 */

const appHandlers = require('./app-handlers');
const windowHandlers = require('./window-handlers');
const fileHandlers = require('./file-handlers');
const settingsHandlers = require('./settings-handlers');
const gameHandlers = require('./game-handlers');

/**
 * Register all IPC handlers for a window
 * @param {BrowserWindow} mainWindow - Reference to the main browser window
 * @returns {Object} Combined object with all IPC handlers
 */
function registerAllHandlers(mainWindow) {
  // Register individual module handlers
  const appMessageHandlers = appHandlers.registerHandlers(mainWindow);
  const windowMessageHandlers = windowHandlers.registerHandlers(mainWindow);
  const fileMessageHandlers = fileHandlers.registerHandlers(mainWindow);
  const settingsMessageHandlers = settingsHandlers.registerHandlers(mainWindow);
  
  // Register game handlers
  gameHandlers.registerGameHandlers();
  gameHandlers.registerGameWindow(mainWindow);
  
  // Combine all handlers into a single object
  const combinedHandlers = {
    ...appMessageHandlers,
    ...windowMessageHandlers,
    ...fileMessageHandlers,
    ...settingsMessageHandlers
  };
  
  return combinedHandlers;
}

module.exports = {
  registerAllHandlers,
  createGenericHandler: (type, handler) => {
    return handler; // Simple passthrough for now
  }
};
